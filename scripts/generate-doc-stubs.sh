#!/bin/bash
# Script to generate documentation stub files with frontmatter

create_stub() {
  local file=$1
  local title=$2
  local category=$3
  local description=$4

  cat > "$file" <<EOF
---
status: draft
created: 2025-11-02
updated: 2025-11-02
category: $category
tags: []
---

# $title

> ⚠️ **Status**: This document is a stub and needs content.

## Overview

$description

## Contents

[Planned sections]

## Related Documentation

[Links to related docs]
EOF

  echo "✅ Created: $file"
}

# Getting Started
create_stub "docs/getting-started/quickstart-developer.md" "Developer Quick Start" "getting-started" "Quick start guide for developers new to Practice Hub."
create_stub "docs/getting-started/quickstart-ai-agent.md" "AI Agent Quick Start" "getting-started" "Quick start guide for AI agents working with Practice Hub codebase."
create_stub "docs/getting-started/project-structure.md" "Project Structure" "getting-started" "Overview of the Practice Hub project directory structure and organization."
create_stub "docs/getting-started/common-tasks.md" "Common Development Tasks" "getting-started" "Frequently performed development tasks and how to accomplish them."

# Development
create_stub "docs/development/creating-routers.md" "Creating tRPC Routers" "development" "Guide to creating and configuring tRPC routers in Practice Hub."
create_stub "docs/development/adding-tables.md" "Adding Database Tables" "development" "How to add new database tables using Drizzle ORM."
create_stub "docs/development/creating-components.md" "Creating UI Components" "development" "Guide to creating React components following Practice Hub design system."
create_stub "docs/development/testing-guide.md" "Testing Guide" "development" "Comprehensive guide to testing in Practice Hub (unit, integration, E2E)."
create_stub "docs/development/debugging-guide.md" "Debugging Guide" "development" "Common debugging techniques and tools for Practice Hub."
create_stub "docs/development/technical-debt.md" "Technical Debt Inventory" "development" "Known technical debt items and prioritization."

# Testing
create_stub "docs/testing/unit-testing.md" "Unit Testing" "testing" "Guide to writing and running unit tests with Vitest."
create_stub "docs/testing/integration-testing.md" "Integration Testing" "testing" "Guide to integration testing patterns and best practices."
create_stub "docs/testing/e2e-testing.md" "End-to-End Testing" "testing" "Guide to E2E testing with Playwright."
create_stub "docs/testing/test-data-factories.md" "Test Data Factories" "testing" "Using test data factories for consistent test setup."
create_stub "docs/testing/coverage-guidelines.md" "Coverage Guidelines" "testing" "Test coverage targets and measurement strategies."

# Modules
create_stub "docs/modules/client-hub/README.md" "Client Hub Module" "modules" "Overview of the Client Hub module functionality and architecture."
create_stub "docs/modules/proposal-hub/README.md" "Proposal Hub Module" "modules" "Overview of the Proposal Hub module functionality and architecture."
create_stub "docs/modules/practice-hub/README.md" "Practice Hub Module" "modules" "Overview of the Practice Hub module functionality and architecture."
create_stub "docs/modules/admin-panel/README.md" "Admin Panel Module" "modules" "Overview of the Admin Panel functionality and architecture."
create_stub "docs/modules/client-portal/README.md" "Client Portal Module" "modules" "Overview of the Client Portal functionality and architecture."

# Decisions
create_stub "docs/decisions/0001-example-adr.md" "Example Architecture Decision Record" "decisions" "Template example for documenting architectural decisions."

cat > "docs/decisions/README.md" <<EOF
---
status: active
created: 2025-11-02
updated: 2025-11-02
category: decisions
tags: [adr, architecture]
---

# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural and design decisions made for Practice Hub.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows the template in [\`.templates/ADR_TEMPLATE.md\`](../.templates/ADR_TEMPLATE.md).

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](0001-example-adr.md) | Example ADR | Example | 2025-11-02 |

## Creating a New ADR

1. Copy the template: \`cp docs/.templates/ADR_TEMPLATE.md docs/decisions/NNNN-title.md\`
2. Fill in the sections
3. Update this index
4. Commit with message: \`docs(adr): add ADR NNNN - title\`

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [ADR Template](../.templates/ADR_TEMPLATE.md)
EOF

echo "✅ Created: docs/decisions/README.md"

echo ""
echo "========================================="
echo "✅ Generated 21 stub markdown files"
echo "========================================="
