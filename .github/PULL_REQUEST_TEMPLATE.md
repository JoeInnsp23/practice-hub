## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement
- [ ] CI/CD or DevOps change

## Related Issues

<!-- Link related issues here using #issue_number -->

Closes #

## Changes Made

<!-- List the main changes in this PR -->

-
-
-

## Documentation Updates

<!-- Check all that apply -->

- [ ] Added/updated `@doc` tags in code
- [ ] Updated reference documentation (API, database, env vars)
- [ ] Updated architecture documentation
- [ ] Updated development guides
- [ ] Created/updated ADR (Architecture Decision Record)
- [ ] Updated README.md or module READMEs
- [ ] No documentation updates needed

## Testing

<!-- Describe the testing you've performed -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed
- [ ] All tests pass locally

### Test Coverage

<!-- If applicable, include test coverage metrics -->

```
Overall coverage: ___%
Changed files coverage: ___%
```

## Database Changes

<!-- Check if applicable -->

- [ ] Schema changes (tables, columns, indexes)
- [ ] Seed data updates
- [ ] Migration script created
- [ ] Database reset tested (`pnpm db:reset`)
- [ ] No database changes

## Breaking Changes

<!-- If this PR includes breaking changes, describe them and the migration path -->

<!-- N/A if no breaking changes -->

## Checklist

### Code Quality

- [ ] Code follows project style guidelines (Biome check passes)
- [ ] TypeScript type-check passes (`pnpm typecheck`)
- [ ] No console.log statements in production code
- [ ] Error tracking uses Sentry (not console.error)
- [ ] SQL queries use Drizzle ORM helpers (no raw SQL with ANY())

### Design Standards

- [ ] Uses shadcn/ui components where applicable
- [ ] Follows Critical Design Elements (glass-card, solid backgrounds, no transparency)
- [ ] Uses react-hot-toast for notifications
- [ ] Maintains light/dark theme consistency
- [ ] Follows module color scheme

### Multi-Tenancy

- [ ] All queries include tenant isolation (where applicable)
- [ ] Uses `ctx.authContext.tenantId` from tRPC context
- [ ] Client portal queries include both `tenantId` AND `clientId`
- [ ] No cross-tenant data leakage possible

### Security

- [ ] No secrets or sensitive data in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS prevention (proper escaping)
- [ ] CSRF protection maintained (for forms)
- [ ] Authentication/authorization checks in place

### Documentation

- [ ] `pnpm docs:facts` run and committed
- [ ] `pnpm docs:extract` run and committed
- [ ] `pnpm docs:build` run and committed
- [ ] `pnpm docs:validate` passes
- [ ] Generated files committed (repo-facts.json, doclets.yaml, doc-index.json)

### Pre-Merge Validation

- [ ] All CI checks pass
- [ ] No merge conflicts
- [ ] Branch is up-to-date with base branch
- [ ] Commit messages follow Conventional Commits format
- [ ] PR has been self-reviewed

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Deployment Notes

<!-- Any special considerations for deployment -->

<!-- N/A if no special deployment requirements -->

## Additional Context

<!-- Add any other context about the PR here -->

---

**Generated with**: [Claude Code](https://claude.com/claude-code)
