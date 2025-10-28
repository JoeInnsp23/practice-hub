#!/bin/bash

# ============================================================================
# Reusable Documentation System Installer
# Automated installation script with smart project detection
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Reusable Documentation System Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# STEP 1: Detect Project Structure
# ============================================================================

echo -e "${BLUE}🔍 Detecting project structure...${NC}"
echo ""

# Detect project type
if [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ] || [ -f "$PROJECT_ROOT/lerna.json" ]; then
    DETECTED_TYPE="monorepo"
    echo -e "  Project type: ${GREEN}Monorepo${NC}"
else
    DETECTED_TYPE="single-repo"
    echo -e "  Project type: ${GREEN}Single-repo${NC}"
fi

# Detect languages
DETECTED_LANGS=""
if [ -f "$PROJECT_ROOT/package.json" ] || [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
    DETECTED_LANGS="TypeScript"
fi
if [ -f "$PROJECT_ROOT/requirements.txt" ] || [ -f "$PROJECT_ROOT/setup.py" ] || [ -f "$PROJECT_ROOT/pyproject.toml" ]; then
    if [ -n "$DETECTED_LANGS" ]; then
        DETECTED_LANGS="$DETECTED_LANGS + Python"
    else
        DETECTED_LANGS="Python"
    fi
fi

if [ -z "$DETECTED_LANGS" ]; then
    DETECTED_LANGS="Unknown"
fi

echo -e "  Languages: ${GREEN}$DETECTED_LANGS${NC}"
echo ""

# ============================================================================
# STEP 2: Configuration Prompts
# ============================================================================

echo -e "${BLUE}⚙️  Configuration${NC}"
echo ""

# Skill name
read -p "Skill name (default: myproject-docs-search): " SKILL_NAME
SKILL_NAME=${SKILL_NAME:-myproject-docs-search}
echo -e "  ✓ Skill name: ${GREEN}$SKILL_NAME${NC}"

# Project name (for skill description)
read -p "Project display name (default: MyProject): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-MyProject}
echo -e "  ✓ Project name: ${GREEN}$PROJECT_NAME${NC}"

# TypeScript entry points (if TypeScript detected)
if [[ "$DETECTED_LANGS" == *"TypeScript"* ]]; then
    if [ "$DETECTED_TYPE" == "monorepo" ]; then
        DEFAULT_TS_ENTRY='["packages/*/src/**/*.ts", "apps/web/src/**/*.tsx"]'
    else
        DEFAULT_TS_ENTRY='["src/**/*.ts"]'
    fi
    read -p "TypeScript entry points (default: auto): " TS_ENTRY_POINTS
    TS_ENTRY_POINTS=${TS_ENTRY_POINTS:-$DEFAULT_TS_ENTRY}
    echo -e "  ✓ TypeScript entries: ${GREEN}$TS_ENTRY_POINTS${NC}"
fi

# Python source path (if Python detected)
if [[ "$DETECTED_LANGS" == *"Python"* ]]; then
    if [ "$DETECTED_TYPE" == "monorepo" ]; then
        DEFAULT_PY_PATH="apps/api"
    else
        DEFAULT_PY_PATH="src"
    fi
    read -p "Python source path (default: $DEFAULT_PY_PATH): " PY_SOURCE_PATH
    PY_SOURCE_PATH=${PY_SOURCE_PATH:-$DEFAULT_PY_PATH}
    echo -e "  ✓ Python path: ${GREEN}$PY_SOURCE_PATH${NC}"
fi

# Merge with existing pre-commit hook
MERGE_HOOK="no"
if [ -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
    read -p "Merge with existing pre-commit hook? (yes/no, default: yes): " MERGE_HOOK
    MERGE_HOOK=${MERGE_HOOK:-yes}
    echo -e "  ✓ Merge hook: ${GREEN}$MERGE_HOOK${NC}"
fi

echo ""

# ============================================================================
# STEP 3: Install Dependencies
# ============================================================================

echo -e "${BLUE}📦 Installing dependencies...${NC}"
echo ""

# TypeScript dependencies
if [[ "$DETECTED_LANGS" == *"TypeScript"* ]]; then
    if command -v pnpm &> /dev/null; then
        echo "  Installing TypeScript dependencies (pnpm)..."
        pnpm install --save-dev typedoc typedoc-plugin-markdown ts-node
        echo -e "  ${GREEN}✓${NC} TypeScript dependencies installed"
    elif command -v npm &> /dev/null; then
        echo "  Installing TypeScript dependencies (npm)..."
        npm install --save-dev typedoc typedoc-plugin-markdown ts-node
        echo -e "  ${GREEN}✓${NC} TypeScript dependencies installed"
    else
        echo -e "  ${YELLOW}⚠️  npm/pnpm not found, skipping TypeScript dependencies${NC}"
    fi
fi

# Python dependencies
if [[ "$DETECTED_LANGS" == *"Python"* ]]; then
    if command -v pip3 &> /dev/null; then
        echo "  Installing Python dependencies (pip3)..."
        pip3 install pdoc3
        echo -e "  ${GREEN}✓${NC} Python dependencies installed"
    elif command -v pip &> /dev/null; then
        echo "  Installing Python dependencies (pip)..."
        pip install pdoc3
        echo -e "  ${GREEN}✓${NC} Python dependencies installed"
    else
        echo -e "  ${YELLOW}⚠️  pip not found, skipping Python dependencies${NC}"
    fi
fi

echo ""

# ============================================================================
# STEP 4: Copy and Customize Templates
# ============================================================================

echo -e "${BLUE}📝 Installing templates...${NC}"
echo ""

# TypeDoc config
if [[ "$DETECTED_LANGS" == *"TypeScript"* ]]; then
    echo "  Copying typedoc.json..."
    cp "$TEMPLATE_DIR/typedoc.json.template" "$PROJECT_ROOT/typedoc.json"

    # Customize entry points
    if [ "$DETECTED_TYPE" == "monorepo" ]; then
        # Keep default monorepo entry points
        :
    else
        # Update to single-repo entry points
        sed -i.bak 's|"packages/\*/src/\*\*/\*.ts",||g' "$PROJECT_ROOT/typedoc.json"
        sed -i.bak 's|"apps/web/src/\*\*/\*.tsx"|"src/**/*.ts"|g' "$PROJECT_ROOT/typedoc.json"
        rm "$PROJECT_ROOT/typedoc.json.bak"
    fi

    echo -e "  ${GREEN}✓${NC} typedoc.json installed"
fi

# Package.json scripts
if [ -f "$PROJECT_ROOT/package.json" ]; then
    echo "  Adding package.json scripts..."

    # Read current package.json
    PACKAGE_JSON=$(cat "$PROJECT_ROOT/package.json")

    # Add scripts (manual merge - user will need to verify)
    echo -e "  ${YELLOW}⚠️  Manual step required:${NC}"
    echo "     Add these scripts to package.json:"
    echo ""
    cat "$TEMPLATE_DIR/package-json-scripts.json"
    echo ""
    echo "     Replace PROJECT-docs-search with: $SKILL_NAME"
    if [[ "$DETECTED_LANGS" == *"Python"* ]]; then
        echo "     Replace 'apps/api' with: $PY_SOURCE_PATH"
    fi
    echo ""
    read -p "  Press Enter when done..."
fi

# Create skill directory
echo "  Creating skill directory..."
mkdir -p "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts"
echo -e "  ${GREEN}✓${NC} Skill directory created"

# Copy SKILL.md
echo "  Copying SKILL.md..."
cp "$TEMPLATE_DIR/SKILL.md.template" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/SKILL.md"
# Customize skill name and project name
sed -i.bak "s/PROJECT-docs-search/$SKILL_NAME/g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/SKILL.md"
sed -i.bak "s/PROJECT_NAME/$PROJECT_NAME/g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/SKILL.md"
rm "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/SKILL.md.bak"
echo -e "  ${GREEN}✓${NC} SKILL.md installed and customized"

# Copy doc-index.yaml
echo "  Copying doc-index.yaml..."
cp "$TEMPLATE_DIR/doc-index.yaml.template" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/doc-index.yaml"
sed -i.bak "s/PROJECT_NAME/$PROJECT_NAME/g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/doc-index.yaml"
rm "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/doc-index.yaml.bak"
echo -e "  ${GREEN}✓${NC} doc-index.yaml installed"

# Copy code index generator
echo "  Copying code index generator..."
cp "$SCRIPT_DIR/generate-code-index.ts" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts/"
# Customize paths if needed
if [ "$DETECTED_TYPE" == "single-repo" ]; then
    # Update paths for single-repo
    sed -i.bak "s|path.join(rootDir, 'packages')|path.join(rootDir, 'src')|g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts/generate-code-index.ts"
    sed -i.bak "s|path.join(rootDir, 'apps/web')|path.join(rootDir, 'src')|g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts/generate-code-index.ts"
    if [[ "$DETECTED_LANGS" == *"Python"* ]]; then
        sed -i.bak "s|path.join(rootDir, 'apps/api')|path.join(rootDir, '$PY_SOURCE_PATH')|g" "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts/generate-code-index.ts"
    fi
    rm "$PROJECT_ROOT/.claude/skills/$SKILL_NAME/scripts/generate-code-index.ts.bak"
fi
echo -e "  ${GREEN}✓${NC} Code index generator installed"

# Pre-commit hook
echo "  Installing pre-commit hook..."
if [ "$MERGE_HOOK" == "yes" ] && [ -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
    # Append to existing hook
    echo "" >> "$PROJECT_ROOT/.husky/pre-commit"
    cat "$TEMPLATE_DIR/pre-commit.sh.template" >> "$PROJECT_ROOT/.husky/pre-commit"
    echo -e "  ${GREEN}✓${NC} Pre-commit hook merged with existing"
else
    # Create new hook
    mkdir -p "$PROJECT_ROOT/.husky"
    cp "$TEMPLATE_DIR/pre-commit.sh.template" "$PROJECT_ROOT/.husky/pre-commit"
    chmod +x "$PROJECT_ROOT/.husky/pre-commit"
    echo -e "  ${GREEN}✓${NC} Pre-commit hook created"
fi

# Customize hook paths
sed -i.bak "s/PROJECT-docs-search/$SKILL_NAME/g" "$PROJECT_ROOT/.husky/pre-commit"
rm "$PROJECT_ROOT/.husky/pre-commit.bak"

echo ""

# ============================================================================
# STEP 5: Generate Initial Documentation
# ============================================================================

echo -e "${BLUE}📚 Generating initial documentation...${NC}"
echo ""

if [[ "$DETECTED_LANGS" == *"TypeScript"* ]]; then
    echo "  Generating TypeScript API docs..."
    cd "$PROJECT_ROOT"
    if command -v pnpm &> /dev/null; then
        pnpm docs:generate > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  TypeDoc generation skipped (no documented code yet)${NC}"
    else
        npm run docs:generate > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  TypeDoc generation skipped (no documented code yet)${NC}"
    fi
    echo -e "  ${GREEN}✓${NC} TypeScript docs generated (if applicable)"
fi

if [[ "$DETECTED_LANGS" == *"Python"* ]]; then
    echo "  Generating Python API docs..."
    cd "$PROJECT_ROOT"
    if command -v pnpm &> /dev/null; then
        pnpm docs:generate:python > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  pdoc3 generation skipped (no documented code yet)${NC}"
    else
        npm run docs:generate:python > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  pdoc3 generation skipped (no documented code yet)${NC}"
    fi
    echo -e "  ${GREEN}✓${NC} Python docs generated (if applicable)"
fi

echo "  Generating code index..."
cd "$PROJECT_ROOT"
if command -v pnpm &> /dev/null; then
    pnpm docs:generate:code-index > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  Code index skipped (no documented code yet)${NC}"
else
    npm run docs:generate:code-index > /dev/null 2>&1 || echo -e "  ${YELLOW}⚠️  Code index skipped (no documented code yet)${NC}"
fi
echo -e "  ${GREEN}✓${NC} Code index generated (if applicable)"

echo ""

# ============================================================================
# STEP 6: Summary
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Installation complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Installed components:"
echo "  ✓ Skill: .claude/skills/$SKILL_NAME/"
echo "  ✓ TypeDoc config: typedoc.json"
echo "  ✓ Pre-commit hook: .husky/pre-commit"
echo "  ✓ Code index generator"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Add package.json scripts (see above)"
echo ""
echo "  2. Customize doc-index.yaml:"
echo "     Edit .claude/skills/$SKILL_NAME/doc-index.yaml"
echo "     - Add your project's concepts (features, components)"
echo "     - Map concepts to your documentation files"
echo "     - Remove unused domains (prd, stories, qa-gates if not applicable)"
echo ""
echo "  3. Add documentation to your code:"
echo "     - Add JSDoc to TypeScript functions/types"
echo "     - Add docstrings to Python functions/classes"
echo "     - Include @example blocks"
echo ""
echo "  4. Run validation:"
echo "     bash .ai/reusable-docs-system/scripts/validate-setup.sh"
echo ""
echo "  5. Test the skill:"
echo "     Ask Claude: \"Show me the complete [your-feature] system\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
