# DocuSeal E-Signature Integration

**Location**: `lib/docuseal/`
**Type**: Integration Library
**Status**: Active

## Overview

Self-hosted electronic signature integration for proposal signing and document execution.

## Files

- `client.ts` - DocuSeal API client
- `email-handler.ts` - Email notifications for signing events
- `uk-compliance-fields.ts` - UK-specific form fields

## Key Functions

- `createSubmission(templateId, recipient)` - Create signing request
- `getSubmissionStatus(submissionId)` - Check signing status
- `handleWebhook(event)` - Process signing events

## Environment Variables

- `DOCUSEAL_API_KEY` - API key from admin UI
- `DOCUSEAL_HOST` - Instance URL (http://localhost:3030)
- `DOCUSEAL_SECRET_KEY` - Encryption secret
- `DOCUSEAL_WEBHOOK_SECRET` - Webhook verification

## Documentation

See [DocuSeal Integration Guide](../../docs/guides/integrations/docuseal.md)
