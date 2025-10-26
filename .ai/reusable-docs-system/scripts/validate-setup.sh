#!/bin/bash

# ============================================================================
# Reusable Documentation System Validation Script
# Verifies installation and configuration
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper functions
pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARN_COUNT++))
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Validating documentation system setup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# CHECK 1: Dependencies
# ============================================================================

echo -e "${BLUE}📦 Checking dependencies...${NC}"
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass "Node.js $NODE_VERSION"
else
    warn "Node.js not found (required for TypeScript docs)"
fi

# pnpm/npm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    pass "pnpm $PNPM_VERSION"
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    pass "npm $NPM_VERSION"
else
    warn "pnpm/npm not found (required for TypeScript docs)"
fi

# TypeDoc
if command -v pnpm &> /dev/null; then
    if pnpm list typedoc &> /dev/null; then
        TYPEDOC_VERSION=$(pnpm list typedoc --depth=0 | grep typedoc | awk '{print $2}')
        pass "typedoc $TYPEDOC_VERSION"
    else
        warn "typedoc not installed (run: pnpm install --save-dev typedoc typedoc-plugin-markdown)"
    fi
fi

# ts-node
if command -v pnpm &> /dev/null; then
    if pnpm list ts-node &> /dev/null; then
        pass "ts-node installed"
    else
        warn "ts-node not installed (run: pnpm install --save-dev ts-node)"
    fi
fi

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    pass "$PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    pass "$PYTHON_VERSION"
else
    warn "Python not found (required for Python docs)"
fi

# pdoc3
if command -v pdoc3 &> /dev/null; then
    pass "pdoc3 installed"
else
    warn "pdoc3 not installed (run: pip install pdoc3)"
fi

echo ""

# ============================================================================
# CHECK 2: Configuration Files
# ============================================================================

echo -e "${BLUE}📝 Checking configuration files...${NC}"
echo ""

# typedoc.json
if [ -f "$PROJECT_ROOT/typedoc.json" ]; then
    pass "typedoc.json exists"
else
    fail "typedoc.json missing"
fi

# package.json
if [ -f "$PROJECT_ROOT/package.json" ]; then
    pass "package.json exists"

    # Check for required scripts
    if grep -q '"docs:generate"' "$PROJECT_ROOT/package.json"; then
        pass "docs:generate script found"
    else
        warn "docs:generate script missing in package.json"
    fi

    if grep -q '"docs:generate:code-index"' "$PROJECT_ROOT/package.json"; then
        pass "docs:generate:code-index script found"
    else
        warn "docs:generate:code-index script missing in package.json"
    fi
else
    warn "package.json missing"
fi

# Pre-commit hook
if [ -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
    pass ".husky/pre-commit exists"

    # Check if executable
    if [ -x "$PROJECT_ROOT/.husky/pre-commit" ]; then
        pass ".husky/pre-commit is executable"
    else
        fail ".husky/pre-commit not executable (run: chmod +x .husky/pre-commit)"
    fi
else
    warn ".husky/pre-commit missing (run installer or create manually)"
fi

echo ""

# ============================================================================
# CHECK 3: Skill Configuration
# ============================================================================

echo -e "${BLUE}🔍 Checking skill configuration...${NC}"
echo ""

# Find skill directory
SKILL_DIR=$(find "$PROJECT_ROOT/.claude/skills" -maxdepth 1 -type d -name "*docs-search" 2>/dev/null | head -n 1)

if [ -n "$SKILL_DIR" ]; then
    SKILL_NAME=$(basename "$SKILL_DIR")
    pass "Skill directory found: $SKILL_NAME"

    # Check SKILL.md
    if [ -f "$SKILL_DIR/SKILL.md" ]; then
        pass "SKILL.md exists"

        # Check if customized
        if grep -q "PROJECT-docs-search" "$SKILL_DIR/SKILL.md"; then
            warn "SKILL.md not customized (still contains PROJECT-docs-search)"
        else
            pass "SKILL.md customized"
        fi
    else
        fail "SKILL.md missing"
    fi

    # Check doc-index.yaml
    if [ -f "$SKILL_DIR/doc-index.yaml" ]; then
        pass "doc-index.yaml exists"

        # Check if customized
        if grep -q "PROJECT_NAME" "$SKILL_DIR/doc-index.yaml"; then
            warn "doc-index.yaml not customized (still contains PROJECT_NAME)"
        else
            pass "doc-index.yaml customized"
        fi
    else
        fail "doc-index.yaml missing"
    fi

    # Check code index generator
    if [ -f "$SKILL_DIR/scripts/generate-code-index.ts" ]; then
        pass "generate-code-index.ts exists"
    else
        fail "generate-code-index.ts missing"
    fi

    # Check code-index.yaml (generated)
    if [ -f "$SKILL_DIR/code-index.yaml" ]; then
        pass "code-index.yaml generated"

        # Count entries
        FUNC_COUNT=$(grep -c "^  [a-zA-Z]" "$SKILL_DIR/code-index.yaml" 2>/dev/null || echo "0")
        if [ "$FUNC_COUNT" -gt 0 ]; then
            pass "code-index.yaml has $FUNC_COUNT entries"
        else
            warn "code-index.yaml is empty (no documented code found)"
        fi
    else
        warn "code-index.yaml not generated yet (run: pnpm docs:generate:code-index)"
    fi
else
    fail "No skill directory found (expected .claude/skills/*docs-search)"
fi

echo ""

# ============================================================================
# CHECK 4: Generated Documentation
# ============================================================================

echo -e "${BLUE}📚 Checking generated documentation...${NC}"
echo ""

# TypeScript docs
if [ -d "$PROJECT_ROOT/docs/reference/typescript" ]; then
    TS_MODULE_COUNT=$(find "$PROJECT_ROOT/docs/reference/typescript" -name "*.md" | wc -l)
    if [ "$TS_MODULE_COUNT" -gt 0 ]; then
        pass "TypeScript docs generated ($TS_MODULE_COUNT files)"
    else
        warn "TypeScript docs directory exists but empty"
    fi
else
    warn "TypeScript docs not generated (run: pnpm docs:generate)"
fi

# Python docs
if [ -d "$PROJECT_ROOT/docs/reference/python" ]; then
    PY_MODULE_COUNT=$(find "$PROJECT_ROOT/docs/reference/python" -name "*.md" | wc -l)
    if [ "$PY_MODULE_COUNT" -gt 0 ]; then
        pass "Python docs generated ($PY_MODULE_COUNT files)"
    else
        warn "Python docs directory exists but empty"
    fi
else
    warn "Python docs not generated (run: pnpm docs:generate:python)"
fi

echo ""

# ============================================================================
# CHECK 5: Test Documentation Generation
# ============================================================================

echo -e "${BLUE}🧪 Testing documentation generation...${NC}"
echo ""

cd "$PROJECT_ROOT"

# Test TypeScript docs
if [ -f "typedoc.json" ]; then
    echo "  Testing TypeScript doc generation..."
    if command -v pnpm &> /dev/null; then
        if pnpm docs:generate > /dev/null 2>&1; then
            pass "TypeScript docs generate successfully"
        else
            warn "TypeScript docs generation failed (check entry points in typedoc.json)"
        fi
    fi
fi

# Test code index
if [ -n "$SKILL_DIR" ] && [ -f "$SKILL_DIR/scripts/generate-code-index.ts" ]; then
    echo "  Testing code index generation..."
    if command -v pnpm &> /dev/null; then
        if pnpm docs:generate:code-index > /dev/null 2>&1; then
            pass "Code index generates successfully"
        else
            warn "Code index generation failed (check paths in generate-code-index.ts)"
        fi
    fi
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAIL_COUNT -eq 0 ] && [ $WARN_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ Perfect! All checks passed ($PASS_COUNT/$PASS_COUNT)${NC}"
    echo ""
    echo "Your documentation system is ready to use!"
    echo ""
    echo "Next steps:"
    echo "  1. Add JSDoc/docstrings to your code"
    echo "  2. Customize doc-index.yaml with your project's concepts"
    echo "  3. Test the skill: Ask Claude about your features"
elif [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup mostly complete with $WARN_COUNT warnings${NC}"
    echo -e "${GREEN}✓ Passed: $PASS_COUNT${NC}"
    echo -e "${YELLOW}⚠ Warnings: $WARN_COUNT${NC}"
    echo ""
    echo "Review warnings above and address as needed."
else
    echo -e "${RED}✗ Setup incomplete with $FAIL_COUNT failures and $WARN_COUNT warnings${NC}"
    echo -e "${GREEN}✓ Passed: $PASS_COUNT${NC}"
    echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
    echo -e "${YELLOW}⚠ Warnings: $WARN_COUNT${NC}"
    echo ""
    echo "Review failures above and fix before proceeding."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit with appropriate code
if [ $FAIL_COUNT -eq 0 ]; then
    exit 0
else
    exit 1
fi
