# Pull Request

## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes, no api changes)
- [ ] Documentation update
- [ ] Configuration/Infrastructure change
- [ ] Performance improvement

## Changes Made

<!-- List the main changes made in this PR -->

-
-
-

## Related Issues

<!-- Link to related issues using # notation (e.g., Fixes #123, Closes #456) -->

Fixes #

## Testing

<!-- Describe the tests you ran and how to reproduce them -->

- [ ] Tested locally
- [ ] Added/updated unit tests
- [ ] Added/updated integration tests
- [ ] Tested in staging environment
- [ ] Verified multi-tenant isolation (if applicable)

### Test Instructions

<!-- Provide step-by-step instructions to test this PR -->

1.
2.
3.

## Database Changes

<!-- If this PR includes database schema changes, complete this section -->

- [ ] Schema changes included
- [ ] Updated seed data in `scripts/seed.ts`
- [ ] Tested with `pnpm db:reset`
- [ ] Verified multi-tenant isolation for new tables
- [ ] NO migration files created (development mode)

## Documentation Updates

<!-- Complete this checklist if documentation changes are included -->

- [ ] Updated relevant documentation (if applicable)
- [ ] Ran `scripts/validate-docs.sh` (if docs changed)
- [ ] Added "Last Updated" date to modified docs
- [ ] Verified no conflicting information across docs

## Code Quality

<!-- Confirm code quality checks -->

- [ ] Code follows project conventions (see CLAUDE.md)
- [ ] Ran `pnpm lint` without errors
- [ ] Ran `pnpm format` to format code
- [ ] Used shadcn/ui components where applicable
- [ ] Followed design system (glass-card, solid backgrounds, etc.)
- [ ] Used Sentry for error tracking (no console.error in production code)
- [ ] Added proper TypeScript types

## Security

<!-- Complete if this PR has security implications -->

- [ ] No sensitive data exposed
- [ ] Authentication/authorization properly implemented
- [ ] Input validation added where needed
- [ ] SQL injection prevention verified (using Drizzle parameterized queries)
- [ ] XSS prevention verified

## Screenshots

<!-- If applicable, add screenshots to help explain your changes -->

### Before

<!-- Screenshot of the UI before changes -->

### After

<!-- Screenshot of the UI after changes -->

## Additional Notes

<!-- Add any additional context, considerations, or notes for reviewers -->

## Checklist

<!-- Final checklist before submitting -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have tested my changes thoroughly
- [ ] Any dependent changes have been merged and published
