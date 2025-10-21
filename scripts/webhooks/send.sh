#!/usr/bin/env bash
#
# DocuSeal Webhook Test Harness
#
# Tests DocuSeal webhook endpoint with realistic payloads, HMAC signature verification,
# idempotency checks, and rate limiting behavior.
#
# Usage:
#   ./send.sh <event> <target> [iterations]
#
# Examples:
#   ./send.sh completed localhost         # Single send
#   ./send.sh completed localhost 3       # Idempotency test
#   ./send.sh completed localhost 10      # Rate limit test
#   ./send.sh declined staging            # Staging environment
#

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOADS_DIR="${SCRIPT_DIR}/payloads"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Usage function
usage() {
  cat <<EOF
${BLUE}DocuSeal Webhook Test Harness${NC}

Tests DocuSeal webhook endpoint with sample payloads, HMAC signature verification,
idempotency checks, and rate limiting behavior.

${YELLOW}Usage:${NC}
  $0 [OPTIONS] <event> <target> [iterations]

${YELLOW}Arguments:${NC}
  event        Event type: ${GREEN}completed${NC}, ${RED}declined${NC}, or ${MAGENTA}expired${NC}
  target       Target environment: ${CYAN}localhost${NC} or ${CYAN}staging${NC}
  iterations   Number of times to send (default: 1)
               - Use 2-3 to test idempotency
               - Use 10+ to test rate limiting

${YELLOW}Options:${NC}
  -h, --help   Show this help message

${YELLOW}Environment Variables:${NC}
  DOCUSEAL_WEBHOOK_SECRET  Webhook signature secret (required)
                           Generate: ${CYAN}openssl rand -base64 32${NC}

${YELLOW}Examples:${NC}
  ${CYAN}# Single completed event to localhost${NC}
  export DOCUSEAL_WEBHOOK_SECRET="your_secret_here"
  $0 completed localhost

  ${CYAN}# Test idempotency (send same payload 3 times)${NC}
  $0 completed localhost 3

  ${CYAN}# Test rate limiting (10 rapid requests)${NC}
  $0 completed localhost 10

  ${CYAN}# Test declined event${NC}
  $0 declined localhost

  ${CYAN}# Test expired event${NC}
  $0 expired localhost

  ${CYAN}# Test on staging${NC}
  DOCUSEAL_WEBHOOK_SECRET="staging_secret" $0 completed staging

${YELLOW}Expected Behaviors:${NC}

  ${GREEN}Idempotency (3 iterations):${NC}
    Request 1: 200 OK (processes webhook, creates signature record)
    Request 2: 200 OK (cached response: {ok: true, cached: true})
    Request 3: 200 OK (cached response: {ok: true, cached: true})

  ${RED}Rate Limiting (10 iterations):${NC}
    Requests 1-5:  200 OK (within tenant rate limit)
    Requests 6-10: 429 Too Many Requests (tenant rate limit exceeded)
    Headers: X-RateLimit-Remaining: 0, Retry-After: XX seconds

  ${MAGENTA}Declined Event:${NC}
    - Sets proposal status to "rejected"
    - Sends team notification email
    - Logs activity with decline reason

  ${MAGENTA}Expired Event:${NC}
    - Sets proposal status to "expired"
    - Sends team notification email
    - Logs activity with expiration timestamp

${YELLOW}Rate Limits:${NC}
  - Tenant-level:     10 requests/second → 429 Too Many Requests
  - Submission-level: 1 request/second  → 409 Conflict (duplicate spam)

${YELLOW}Security:${NC}
  - HMAC-SHA256 signature verification
  - Timestamp-based replay protection (5 minute window)
  - Invalid signatures return 401 Unauthorized

EOF
  exit 1
}

# Parse arguments
if [[ $# -lt 2 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
  usage
fi

EVENT_TYPE="$1"
TARGET="$2"
ITERATIONS="${3:-1}"

# Validate event type
if [[ ! "$EVENT_TYPE" =~ ^(completed|declined|expired)$ ]]; then
  echo -e "${RED}Error: Invalid event type '$EVENT_TYPE'.${NC}"
  echo -e "Must be ${GREEN}completed${NC}, ${RED}declined${NC}, or ${MAGENTA}expired${NC}."
  exit 1
fi

# Validate iterations
if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$ITERATIONS" -lt 1 ]]; then
  echo -e "${RED}Error: Iterations must be a positive integer.${NC}"
  exit 1
fi

# Check for webhook secret
if [[ -z "${DOCUSEAL_WEBHOOK_SECRET:-}" ]]; then
  echo -e "${RED}Error: DOCUSEAL_WEBHOOK_SECRET environment variable is not set.${NC}"
  echo -e "Generate one with: ${CYAN}openssl rand -base64 32${NC}"
  exit 1
fi

# Set target URL
case "$TARGET" in
  localhost)
    WEBHOOK_URL="http://localhost:3000/api/webhooks/docuseal"
    ;;
  staging)
    WEBHOOK_URL="https://staging.practicehub.com/api/webhooks/docuseal"
    ;;
  *)
    echo -e "${RED}Error: Invalid target '$TARGET'.${NC}"
    echo -e "Must be ${CYAN}localhost${NC} or ${CYAN}staging${NC}."
    exit 1
    ;;
esac

# Load payload
PAYLOAD_FILE="${PAYLOADS_DIR}/${EVENT_TYPE}.json"
if [[ ! -f "$PAYLOAD_FILE" ]]; then
  echo -e "${RED}Error: Payload file not found: $PAYLOAD_FILE${NC}"
  exit 1
fi

PAYLOAD=$(cat "$PAYLOAD_FILE")

# Display header
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${YELLOW}DocuSeal Webhook Test Harness${NC}                                  ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Event:${NC}       $EVENT_TYPE"
echo -e "${CYAN}Target:${NC}      $WEBHOOK_URL"
echo -e "${CYAN}Iterations:${NC}  $ITERATIONS"
echo -e "${CYAN}Payload:${NC}     $PAYLOAD_FILE"
echo ""

# Temporary files for response data
RESPONSE_FILE="/tmp/webhook_response_$$.txt"
HEADERS_FILE="/tmp/webhook_headers_$$.txt"

# Cleanup on exit
trap "rm -f $RESPONSE_FILE $HEADERS_FILE" EXIT

# Track statistics
SUCCESS_COUNT=0
CACHED_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0

# Send webhook(s)
for i in $(seq 1 "$ITERATIONS"); do
  echo -e "${YELLOW}═══ Request $i/$ITERATIONS ═══${NC}"

  # Generate timestamp (Unix epoch)
  TIMESTAMP=$(date +%s)

  # Compute HMAC-SHA256 signature
  # Note: DocuSeal uses the raw JSON body for signature
  SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$DOCUSEAL_WEBHOOK_SECRET" | sed 's/^.* //')

  # Send request and capture response
  HTTP_CODE=$(curl -s -o "$RESPONSE_FILE" -w "%{http_code}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "x-docuseal-signature: $SIGNATURE" \
    -H "x-docuseal-timestamp: $TIMESTAMP" \
    -d "$PAYLOAD" \
    -D "$HEADERS_FILE" 2>/dev/null || echo "000")

  # Extract rate limit headers if present
  RATE_LIMIT_REMAINING=$(grep -i "^x-ratelimit-remaining:" "$HEADERS_FILE" 2>/dev/null | awk '{print $2}' | tr -d '\r' || echo "")
  RATE_LIMIT_RESET=$(grep -i "^x-ratelimit-reset:" "$HEADERS_FILE" 2>/dev/null | awk '{print $2}' | tr -d '\r' || echo "")
  RETRY_AFTER=$(grep -i "^retry-after:" "$HEADERS_FILE" 2>/dev/null | awk '{print $2}' | tr -d '\r' || echo "")

  # Parse response body (if JSON)
  RESPONSE_BODY=$(cat "$RESPONSE_FILE" 2>/dev/null || echo "")
  IS_CACHED=$(echo "$RESPONSE_BODY" | grep -o '"cached"[[:space:]]*:[[:space:]]*true' || echo "")

  # Display results based on status code
  case "$HTTP_CODE" in
    200)
      if [[ -n "$IS_CACHED" ]]; then
        echo -e "  ${GREEN}✓ Status: 200 OK (Idempotency - Cached)${NC}"
        ((CACHED_COUNT++))
      else
        echo -e "  ${GREEN}✓ Status: 200 OK (Processed)${NC}"
        ((SUCCESS_COUNT++))
      fi
      ;;
    401)
      echo -e "  ${RED}✗ Status: 401 Unauthorized (Invalid Signature)${NC}"
      ((ERROR_COUNT++))
      ;;
    409)
      echo -e "  ${YELLOW}⚠ Status: 409 Conflict (Submission Spam Detected)${NC}"
      ((RATE_LIMITED_COUNT++))
      ;;
    429)
      echo -e "  ${RED}✗ Status: 429 Too Many Requests (Rate Limited)${NC}"
      ((RATE_LIMITED_COUNT++))
      ;;
    000)
      echo -e "  ${RED}✗ Status: Connection Failed${NC}"
      ((ERROR_COUNT++))
      ;;
    *)
      echo -e "  ${RED}✗ Status: $HTTP_CODE${NC}"
      ((ERROR_COUNT++))
      ;;
  esac

  # Show signature info (first 20 chars)
  echo -e "  ${CYAN}Timestamp:${NC}  $TIMESTAMP"
  echo -e "  ${CYAN}Signature:${NC}  ${SIGNATURE:0:20}...${SIGNATURE: -20}"

  # Show rate limit info if available
  if [[ -n "$RATE_LIMIT_REMAINING" ]]; then
    if [[ "$RATE_LIMIT_REMAINING" == "0" ]]; then
      echo -e "  ${RED}Rate Limit:${NC} ${RED}$RATE_LIMIT_REMAINING remaining${NC}"
    else
      echo -e "  ${CYAN}Rate Limit:${NC} $RATE_LIMIT_REMAINING remaining"
    fi
  fi

  if [[ -n "$RATE_LIMIT_RESET" ]]; then
    # Try to format the reset time (ISO 8601 format)
    echo -e "  ${CYAN}Reset At:${NC}   $RATE_LIMIT_RESET"
  fi

  if [[ -n "$RETRY_AFTER" ]]; then
    echo -e "  ${YELLOW}Retry After:${NC} ${RETRY_AFTER}s"
  fi

  # Show response body for non-200 or if verbose
  if [[ "$HTTP_CODE" != "200" ]] || [[ -n "$IS_CACHED" ]]; then
    if [[ -n "$RESPONSE_BODY" ]]; then
      echo -e "  ${CYAN}Response:${NC}"
      if command -v jq >/dev/null 2>&1; then
        echo "$RESPONSE_BODY" | jq '.' 2>/dev/null | sed 's/^/    /' || echo "    $RESPONSE_BODY"
      else
        echo "    $RESPONSE_BODY"
      fi
    fi
  fi

  echo ""

  # Small delay between requests (except last one)
  if [[ $i -lt $ITERATIONS ]]; then
    sleep 0.2
  fi
done

# Display summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${YELLOW}Summary${NC}                                                        ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Successful:${NC}    $SUCCESS_COUNT"
echo -e "${CYAN}Cached:${NC}        $CACHED_COUNT"
echo -e "${RED}Rate Limited:${NC}  $RATE_LIMITED_COUNT"
echo -e "${RED}Errors:${NC}        $ERROR_COUNT"
echo -e "${CYAN}Total:${NC}         $ITERATIONS"
echo ""

# Show behavioral notes based on results
if [[ $ITERATIONS -gt 1 ]] && [[ $CACHED_COUNT -gt 0 ]]; then
  echo -e "${GREEN}✓ Idempotency Working:${NC} $CACHED_COUNT cached responses detected."
  echo -e "  The webhook correctly returns cached results for duplicate submissions."
  echo ""
fi

if [[ $RATE_LIMITED_COUNT -gt 0 ]]; then
  echo -e "${YELLOW}⚠ Rate Limiting Triggered:${NC} $RATE_LIMITED_COUNT requests were rate limited."
  echo -e "  This is expected when sending $ITERATIONS requests rapidly."
  echo -e "  ${CYAN}Tenant limit:${NC}     10 requests/second → 429 Too Many Requests"
  echo -e "  ${CYAN}Submission limit:${NC} 1 request/second  → 409 Conflict"
  echo ""
fi

if [[ $ERROR_COUNT -gt 0 ]]; then
  echo -e "${RED}✗ Errors Detected:${NC} $ERROR_COUNT requests failed."
  echo -e "  Check the response details above for more information."
  echo ""
fi

# Final tips
if [[ $ITERATIONS -eq 1 ]]; then
  echo -e "${CYAN}Tip:${NC} Use multiple iterations to test idempotency and rate limiting:"
  echo -e "  ${YELLOW}$0 $EVENT_TYPE $TARGET 3${NC}   # Test idempotency"
  echo -e "  ${YELLOW}$0 $EVENT_TYPE $TARGET 10${NC}  # Test rate limiting"
  echo ""
fi

echo -e "${GREEN}═══ Test Complete ═══${NC}"
