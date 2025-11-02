---
name: practice-hub-docs-search
description: Search Practice Hub documentation for architecture, API reference, database schema, integrations, and implementation patterns. Triggers when user asks about multi-tenancy, authentication, tRPC routers, database, Better Auth, pricing calculator, Client Hub, Proposal Hub, Admin Panel, Client Portal, design system, integrations (LEM Verify, Gemini AI, DocuSeal, S3), or implementation patterns.
allowed-tools: Read, Grep, Glob
---

# Practice Hub Documentation Search Skill

**Purpose**: Provide comprehensive, context-aware documentation search for Practice Hub development tasks.

**Trigger Patterns**: This skill automatically activates when the user asks about:
- Multi-tenancy architecture (tenant isolation, dual isolation with tenantId + clientId)
- Authentication systems (Better Auth dual system, staff vs client portal)
- tRPC API design (creating routers, protected procedures, context)
- Database schema (tables, views, indexes, migrations)
- Integrations (LEM Verify KYC, Google Gemini AI, DocuSeal e-signature, S3 storage, Xero)
- Practice Hub modules (Client Hub, Proposal Hub, Admin Panel, Client Portal)
- Pricing calculator (28 services, 138+ rules, service components)
- Design system (glass-card patterns, shadcn/ui components)
- Implementation patterns and coding standards

## How This Skill Works

1. **Code Index Lookup** - Fast function/type signature lookups with file:line references
2. **Concept Search** - Finds all relevant docs across 6 domains (Architecture, API, Guides, Operations, Stories, QA)
3. **Context Assembly** - Returns comprehensive context for implementation tasks

## Available Searches

### By Query Type

**Architecture Questions**:
- "How does multi-tenancy work?"
- "What's the authentication architecture?"
- "Show me the complete tRPC design"
- "How is the database structured?"

**API Reference**:
- "What's the signature for getAuthContext?"
- "Show me the clients router"
- "How do I create a protected procedure?"
- "What's in the proposals router?"

**Implementation Guidance**:
- "I'm implementing a new tRPC router"
- "How do I add a new table?"
- "I need to implement client portal authentication"
- "Show me pricing calculator patterns"

**Integration Questions**:
- "How does LEM Verify integration work?"
- "Show me the Gemini AI document extraction"
- "How do I use DocuSeal for e-signatures?"
- "What's the S3 storage pattern?"

### By Concept

The skill indexes 10+ core concepts:

1. **Multi-Tenancy** - Dual-level isolation (tenantId + clientId), schema patterns, query examples
2. **Authentication** - Better Auth dual system, staff vs client portal, session management
3. **tRPC API Design** - Protected procedures, context creation, router patterns, query/mutation examples
4. **Database Schema** - 50+ tables, 14 views, 5 performance indexes, migration patterns
5. **Integrations** - LEM Verify (KYC), Google Gemini (AI), DocuSeal (e-signature), S3 (storage), Xero (accounting)
6. **Client Hub** - CRM module, client management, contacts, directors, PSCs, services
7. **Proposal Hub** - Pricing calculator, proposal generation, lead management, analytics
8. **Admin Panel** - User management, KYC review queue, portal link management
9. **Client Portal** - External client access, onboarding flow, dual isolation patterns
10. **Design System** - Glass-card patterns, shadcn/ui components, module styling, layout backgrounds

## Documentation Domains

This skill searches across 6 documentation domains:

1. **Architecture** (`docs/architecture/`) - System design, patterns, technical architecture
2. **API Reference** (`docs/reference/`) - tRPC routers, database schema, configuration
3. **Guides** (`docs/guides/`) - Integration setup, how-to guides
4. **Operations** (`docs/operations/`) - Deployment, monitoring, backup/recovery
5. **Stories** (`docs/stories/`) - User stories, feature specifications
6. **QA** (`docs/qa/`) - QA assessments, test plans, quality gates

## Search Indexes

The skill maintains two searchable indexes for fast context retrieval:

### 1. Code Index (`code-index.json`)

Extracts and indexes all TypeScript code with JSDoc documentation:

- **Functions** (132 entries) - All exported functions with JSDoc documentation
- **Types** (57 entries) - TypeScript interfaces, types, schemas
- **Components** (12 entries) - React components with props documentation
- **Classes** (4 entries) - Class definitions with documentation

Each entry includes:
- File path and line number (for direct navigation)
- Function signature with parameters
- Description from JSDoc/comments
- Type classification (function/type/component/class)

**File**: `.claude/skills/practice-hub-docs-search/code-index.json`

**Usage**:
```typescript
// Load the index
const codeIndex = require("./.claude/skills/practice-hub-docs-search/code-index.json");

// Search functions
const getAuthContextFn = codeIndex.functions.find(f => f.name === "getAuthContext");
console.log(`${getAuthContextFn.file}:${getAuthContextFn.line}`);
// Output: lib/auth.ts:125
```

### 2. Documentation Index (`doc-index.json`)

Extracts and indexes all markdown documentation with frontmatter:

- **Total**: 32 documented pages across 8 categories
- **Categories**: architecture (7), development (6), testing (5), modules (5), getting-started (4), decisions (3), guides (1), other (1)

Each entry includes:
- Title and file path
- Category and status (draft/active/archived)
- Excerpt (first 200 chars)
- Tags for keyword search
- Created/updated timestamps

**File**: `.claude/skills/practice-hub-docs-search/doc-index.json`

**Usage**:
```typescript
// Load the index
const docIndex = require("./.claude/skills/practice-hub-docs-search/doc-index.json");

// Search by category
const archDocs = docIndex.docs.filter(d => d.category === "architecture");

// Search by keyword in title/excerpt
const authDocs = docIndex.docs.filter(d =>
  d.title.toLowerCase().includes("auth") ||
  d.excerpt.toLowerCase().includes("auth")
);
```

### Index Formats

Both indexes are available in two formats:

- **YAML** (`.yaml`) - Human-readable, grep-friendly
- **JSON** (`.json`) - Programmatic access, faster parsing

Use YAML for manual exploration, JSON for automated tools.

## Usage Examples

### Example 1: Function Signature Lookup
**Query**: "What's the signature for getAuthContext?"

**Returns**:
```
Function: getAuthContext
Location: lib/auth.ts:125
Signature: async function getAuthContext(): Promise<AuthContext | null>
Description: Retrieves authenticated user's session with tenant context
Returns: AuthContext with userId, tenantId, role, email
Example: const authContext = await getAuthContext();
```

### Example 2: Concept Search
**Query**: "Show me the complete multi-tenancy system"

**Returns**:
- Architecture doc: `docs/architecture/multi-tenancy.md`
- API reference: `docs/reference/database/schema.md` (schema patterns)
- Code examples: `lib/auth.ts` (getAuthContext), `app/server/context.ts` (tRPC context)
- Patterns: Query examples, dual isolation patterns

### Example 3: Implementation Context
**Query**: "I'm implementing a new tRPC router"

**Returns**:
- Architecture: `docs/architecture/api-design.md` (router patterns)
- Reference: `docs/reference/api/routers.md` (existing routers)
- Code examples: `app/server/routers/clients.ts` (sample router)
- Patterns: Protected procedures, context usage, error handling

## Integration with Practice Hub Workflow

This skill is designed to work seamlessly with Practice Hub's development workflow:

1. **Respects CLAUDE.md rules** - Always checks critical development rules before providing guidance
2. **Context-aware suggestions** - Knows about Practice Hub's tech stack (Next.js 15, Better Auth, tRPC, PostgreSQL)
3. **Brownfield-aware** - References actual implementation patterns, not idealized examples
4. **Quality gate enforcement** - Reminds about design system constraints, no-migration policy, error tracking policy

## Skill Behavior

**When Activated**:
1. Reads relevant documentation files from `docs/`
2. Searches code index for matching functions/types
3. Assembles comprehensive context with file:line references
4. Returns structured response with sections: Architecture, API, Patterns, Examples

**What This Skill Does NOT Do**:
- Does not write code (only provides documentation and context)
- Does not modify files (read-only skill)
- Does not execute commands (documentation search only)

## Maintenance

**Auto-regeneration**: The code index and TypeScript API docs are automatically regenerated on every git commit via pre-commit hook.

**Manual regeneration**:
```bash
# Regenerate all indexes
pnpm docs:generate:all

# Or individually:
pnpm docs:generate:code-index   # Code index only
pnpm docs:generate:doc-index    # Documentation index only
```

**Update frequency**: Documentation should be updated whenever:
- New functions/types are added with JSDoc
- Documentation files are created/updated in `docs/`
- New concepts/features are added to the system
- Frontmatter is added to documentation files

## Related Skills

- **practice-hub-testing** - Generate router tests, validate multi-tenant isolation
- **practice-hub-debugging** - Find/remove console.log statements, track TODOs
- **practice-hub-database-ops** - Validate schema, check seed consistency, safe database reset
- **brand-guidelines** - Enforce Practice Hub design standards
- **artifacts-builder** - Build UI components following Practice Hub design system

---

**Skill Version**: 1.1.0
**Last Updated**: 2025-11-02
**Maintained By**: Development Team

**Changelog**:
- v1.1.0 (2025-11-02): Added doc-index.json, enhanced code-index with JSON output, updated documentation
- v1.0.0 (2025-10-26): Initial release with code-index.yaml
