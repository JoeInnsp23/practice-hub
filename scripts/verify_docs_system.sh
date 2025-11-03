#!/bin/bash
# Documentation System Verification
#
# Comprehensive verification that the documentation system is working correctly.
# Runs all validation checks and reports overall health.
#
# Usage: bash scripts/verify_docs_system.sh

set -e

echo "========================================"
echo "🔍 Documentation System Verification"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 1. Check Python dependencies
section "Python Dependencies"

if command -v python3 &> /dev/null; then
    success "Python 3 installed"

    if [ -f "scripts/requirements-docs.txt" ]; then
        success "requirements-docs.txt exists"

        # Try importing required packages
        python3 -c "import yaml, markdown, pathspec" 2>/dev/null && \
            success "Python dependencies installed" || \
            error "Python dependencies missing - run: pip install -r scripts/requirements-docs.txt"
    else
        error "requirements-docs.txt not found"
    fi
else
    error "Python 3 not installed"
fi

# 2. Check scripts exist
section "Scripts Existence"

REQUIRED_SCRIPTS=(
    "scripts/derive_repo_facts.ts"
    "scripts/extract_doclets.py"
    "scripts/build_docs.py"
    "scripts/check_doc_drift.py"
    "scripts/audit_taggable_items.py"
    "scripts/generate_tagging_plan.py"
    "scripts/apply_tags.py"
    "scripts/generate_module_readmes.ts"
    "scripts/audit-redundancy.ts"
    "scripts/fix_doc_links.py"
    "scripts/deprecate_typedoc.sh"
    "scripts/setup-docs-precommit.sh"
    "scripts/update_readme_placeholders.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            success "$script (executable)"
        else
            # TypeScript files don't need to be executable (run via tsx)
            if [[ "$script" == *.ts ]]; then
                success "$script exists (TypeScript)"
            else
                warning "$script exists but not executable"
            fi
        fi
    else
        error "$script not found"
    fi
done

# 3. Check configuration files
section "Configuration Files"

REQUIRED_CONFIGS=(
    "docs/books.yaml"
    "docs/dev/DOC_TAGGING_SPEC.md"
    "docs/dev/README.md"
    ".claude/skills/docs-maintainer/SKILL.md"
    ".claude/agents/docs-update.md"
)

for config in "${REQUIRED_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        success "$config exists"
    else
        error "$config not found"
    fi
done

# 4. Check package.json scripts
section "Package.json Scripts"

REQUIRED_SCRIPTS_NPM=(
    "docs:facts"
    "docs:extract"
    "docs:build"
    "docs:validate"
    "docs:maintain"
    "docs:audit-tags"
    "docs:tag-plan"
    "docs:tag-apply"
)

for script in "${REQUIRED_SCRIPTS_NPM[@]}"; do
    if grep -q "\"$script\":" package.json; then
        success "$script defined in package.json"
    else
        error "$script missing from package.json"
    fi
done

# 5. Check generated files
section "Generated Files"

if [ -f "docs/dev/repo-facts.json" ]; then
    success "repo-facts.json exists"

    # Validate JSON
    if jq empty docs/dev/repo-facts.json 2>/dev/null; then
        success "repo-facts.json is valid JSON"

        # Check structure
        if jq -e '.routes.total' docs/dev/repo-facts.json >/dev/null 2>&1; then
            ROUTES=$(jq -r '.routes.total' docs/dev/repo-facts.json)
            success "repo-facts.json contains route data ($ROUTES routes)"
        else
            error "repo-facts.json missing route data"
        fi
    else
        error "repo-facts.json is invalid JSON"
    fi
else
    warning "repo-facts.json not generated yet - run: pnpm docs:facts"
fi

# 6. Test scripts execution
section "Script Execution Tests"

echo "Testing derive_repo_facts..."
if pnpm docs:facts >/dev/null 2>&1; then
    success "derive_repo_facts runs successfully"
else
    error "derive_repo_facts failed to run"
fi

echo "Testing doc index generation..."
if pnpm docs:generate:doc-index >/dev/null 2>&1; then
    success "doc index generation runs successfully"
else
    error "doc index generation failed"
fi

# 7. Check CI workflows
section "CI/CD Workflows"

REQUIRED_WORKFLOWS=(
    ".github/workflows/docs-validation.yml"
    ".github/workflows/security-scan.yml"
)

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        success "$workflow exists"
    else
        error "$workflow not found"
    fi
done

# 8. Check governance files
section "Governance Files"

REQUIRED_GOVERNANCE=(
    "CODEOWNERS"
    ".github/PULL_REQUEST_TEMPLATE.md"
    ".github/labeler.yml"
)

for file in "${REQUIRED_GOVERNANCE[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        error "$file not found"
    fi
done

# 9. Verify documentation structure
section "Documentation Structure"

REQUIRED_DOCS=(
    "docs/dev/DOCUMENTATION_WORKFLOW.md"
    "docs/dev/DOC_TAGGING_SPEC.md"
    "docs/guides/SECRETS_HANDLING.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        success "$doc exists"
    else
        error "$doc not found"
    fi
done

# 10. Summary
echo ""
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ PERFECT: All checks passed!${NC}"
    echo ""
    echo "The documentation system is fully operational."
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  GOOD: All critical checks passed with $WARNINGS warnings${NC}"
    echo ""
    echo "The documentation system is operational but has minor issues."
    echo ""
    exit 0
else
    echo -e "${RED}❌ FAILED: $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "The documentation system has critical issues that need to be resolved."
    echo ""
    exit 1
fi
