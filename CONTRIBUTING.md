# Contributing to Practice Hub

**Last Updated**: 2025-10-10
**Version**: 1.0

Thank you for your interest in contributing to Practice Hub! This document provides guidelines for contributing to the project, whether you're fixing a bug, adding a feature, or improving documentation.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [How to Contribute](#how-to-contribute)
5. [Branch Naming Conventions](#branch-naming-conventions)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Code Review Guidelines](#code-review-guidelines)
9. [Testing Requirements](#testing-requirements)
10. [Documentation Requirements](#documentation-requirements)
11. [Issue Guidelines](#issue-guidelines)
12. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Examples of behavior that contributes to a positive environment**:
- ✅ Using welcoming and inclusive language
- ✅ Being respectful of differing viewpoints and experiences
- ✅ Gracefully accepting constructive criticism
- ✅ Focusing on what is best for the community
- ✅ Showing empathy towards other community members

**Examples of unacceptable behavior**:
- ❌ The use of sexualized language or imagery
- ❌ Trolling, insulting/derogatory comments, and personal or political attacks
- ❌ Public or private harassment
- ❌ Publishing others' private information without explicit permission
- ❌ Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team at [conduct@practicehub.com]. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- ✅ Read the [README.md](README.md) to understand the project
- ✅ Set up your local development environment (see [Development Setup](#development-setup))
- ✅ Read [CLAUDE.md](CLAUDE.md) for critical development rules
- ✅ Familiarized yourself with the [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)

### Types of Contributions

We welcome contributions in the following areas:

**Code Contributions**:
- 🐛 Bug fixes
- ✨ New features
- ⚡ Performance improvements
- ♻️ Code refactoring
- 🔒 Security enhancements

**Non-Code Contributions**:
- 📝 Documentation improvements
- 🧪 Writing tests
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🎨 UI/UX improvements
- 🌐 Translations (future)

---

## Development Setup

### Quick Setup

If you're a new developer, follow the comprehensive [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) guide.

### TL;DR for Experienced Developers

```bash
# Clone repository
git clone <repository-url> practice-hub
cd practice-hub

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start Docker services (PostgreSQL, MinIO)
docker compose up -d

# Initialize database
pnpm db:reset

# Initialize MinIO
chmod +x scripts/setup-minio.sh
./scripts/setup-minio.sh

# Start development server
pnpm dev
```

**Access**: http://localhost:3000

**Test credentials**: `admin@demo.com` / `password`

---

## How to Contribute

### 1. Find or Create an Issue

**Before starting work**:
1. Check existing issues: [GitHub Issues](https://github.com/yourusername/practice-hub/issues)
2. If issue doesn't exist, create one with:
   - Clear description of problem/feature
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots (if applicable)

**Good first issues**: Look for issues labeled `good first issue` for beginner-friendly tasks.

### 2. Claim the Issue

Comment on the issue:
> I'd like to work on this. Expected completion: [date]

Wait for maintainer approval before starting work.

### 3. Fork and Branch

```bash
# Fork repository on GitHub (if external contributor)

# Clone your fork (or main repo for internal contributors)
git clone <your-fork-url>

# Create feature branch
git checkout -b feature/your-feature-name

# Keep your branch up to date
git fetch origin
git rebase origin/main
```

### 4. Make Changes

- Write clean, readable code following [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)
- Add tests for new functionality
- Update documentation as needed
- Follow [CLAUDE.md](CLAUDE.md) critical rules

### 5. Test Your Changes

```bash
# Run linter
pnpm lint

# Run type check
pnpm tsc

# Run tests
pnpm test

# Test manually in browser
pnpm dev  # Visit http://localhost:3000
```

### 6. Commit Your Changes

Follow [Commit Message Guidelines](#commit-message-guidelines):

```bash
git add .
git commit -m "feat: Add client notes feature

- Add notes table to database schema
- Create ClientNotes component
- Add tRPC router for notes CRUD
- Update seed data with sample notes

Closes #123"
```

### 7. Push and Create Pull Request

```bash
# Push to your branch
git push origin feature/your-feature-name

# Open pull request on GitHub
# Fill out PR template completely
```

---

## Branch Naming Conventions

### Format

```
<type>/<short-description>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feature/` | New feature | `feature/add-client-notes` |
| `fix/` | Bug fix | `fix/kyc-webhook-validation` |
| `refactor/` | Code refactoring | `refactor/proposal-calculator` |
| `docs/` | Documentation only | `docs/update-contributing-guide` |
| `test/` | Adding tests | `test/add-clients-router-tests` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `perf/` | Performance improvement | `perf/optimize-client-queries` |
| `style/` | Code style changes | `style/format-client-hub` |

### Examples

**Good**:
- ✅ `feature/client-notes`
- ✅ `fix/kyc-approval-email`
- ✅ `refactor/auth-context`
- ✅ `docs/api-reference`

**Bad**:
- ❌ `my-feature` (no type)
- ❌ `feature/` (no description)
- ❌ `feature/add_client_notes` (use hyphens, not underscores)
- ❌ `feature/add-a-feature-to-allow-clients-to-add-notes-to-their-accounts` (too long)

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add client notes feature` |
| `fix` | Bug fix | `fix: resolve KYC webhook validation` |
| `docs` | Documentation | `docs: update API reference` |
| `style` | Code style (formatting) | `style: format with Biome` |
| `refactor` | Code refactoring | `refactor: simplify auth context` |
| `test` | Adding tests | `test: add clients router tests` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Performance | `perf: optimize database queries` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |
| `build` | Build system | `build: update Next.js config` |
| `revert` | Revert previous commit | `revert: revert feat: add notes` |

### Scopes (Optional)

Scopes indicate which part of the codebase is affected:

- `auth` - Authentication and authorization
- `db` - Database schema or migrations
- `api` - API routes or tRPC routers
- `ui` - UI components
- `client-hub` - Client Hub module
- `proposal-hub` - Proposal Hub module
- `admin` - Admin panel
- `kyc` - KYC/AML system

**Example**: `feat(kyc): add re-verification flow`

### Description

- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

**Good**:
- ✅ `feat: add client notes feature`
- ✅ `fix: resolve webhook validation error`
- ✅ `refactor: simplify auth context logic`

**Bad**:
- ❌ `feat: Added client notes feature.` (past tense, capitalized, period)
- ❌ `fix: Fixed a bug` (not descriptive)
- ❌ `feat: add a really long feature description that exceeds the 50 character limit` (too long)

### Body (Optional)

Provide additional context:
- What changes were made
- Why the changes were necessary
- Any breaking changes

```
feat: add client notes feature

- Add notes table to database schema
- Create ClientNotes component with CRUD operations
- Add tRPC router for notes with tenant isolation
- Update seed data with sample notes
- Add unit tests for notes functionality

This feature allows staff to add private notes to client records,
improving communication and record-keeping.
```

### Footer (Optional)

Reference issues:

```
Closes #123
Fixes #456
Related to #789
```

### Breaking Changes

Mark breaking changes:

```
feat!: redesign auth API

BREAKING CHANGE: `getAuthContext()` now returns Promise<AuthContext | null>
instead of AuthContext. Update all calls to handle null case.
```

### Examples

**Simple commit**:
```
feat: add client notes
```

**Commit with scope**:
```
fix(kyc): resolve webhook signature validation
```

**Commit with body and footer**:
```
feat: add client notes feature

- Add notes table to database schema
- Create ClientNotes component
- Add tRPC router for notes CRUD

Closes #123
```

**Commit with breaking change**:
```
feat!: redesign auth API

BREAKING CHANGE: getAuthContext() now returns Promise<AuthContext | null>
```

---

## Pull Request Process

### Before Submitting

**Checklist**:
- ✅ Code follows [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)
- ✅ All tests pass (`pnpm test`)
- ✅ Linter passes (`pnpm lint`)
- ✅ Type check passes (`pnpm tsc`)
- ✅ Manual testing completed
- ✅ Documentation updated (if needed)
- ✅ Commit messages follow conventions
- ✅ Branch is up to date with `main`

### PR Title

Follow commit message format:

```
feat: add client notes feature
```

### PR Description

Use the PR template:

```markdown
## Description
Brief description of changes and why they're needed.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Added notes table to database schema
- Created ClientNotes component
- Added tRPC router for notes CRUD
- Updated seed data with sample notes

## Testing
### Manual Testing
- [ ] Tested creating notes
- [ ] Tested editing notes
- [ ] Tested deleting notes
- [ ] Tested with multiple tenants (data isolation)

### Automated Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

### PR Size

**Preferred**: Small, focused PRs (< 400 lines changed)

**Large PRs** (> 400 lines):
- Break into multiple smaller PRs if possible
- If not possible, add detailed description and comments

### Draft PRs

Use draft PRs for:
- Work in progress
- Early feedback
- Proof of concept

**Mark as "Ready for Review"** when complete.

---

## Code Review Guidelines

### For Authors

**Responding to feedback**:
- Be open to suggestions
- Ask questions if feedback is unclear
- Make requested changes promptly
- Mark conversations as resolved when addressed

**If you disagree**:
- Explain your reasoning politely
- Suggest alternatives
- Defer to maintainer decision if consensus not reached

### For Reviewers

**What to review**:
- ✅ Code correctness and logic
- ✅ Performance implications
- ✅ Security concerns
- ✅ Test coverage
- ✅ Code style and readability
- ✅ Documentation completeness
- ✅ Breaking changes

**How to provide feedback**:
- Be respectful and constructive
- Explain *why* changes are needed
- Suggest specific improvements
- Approve PRs that meet standards (even if minor suggestions remain)

**Review comments examples**:

**Good**:
> This query could be slow with large datasets. Consider adding an index on `clientId`:
> ```sql
> CREATE INDEX idx_notes_client_id ON notes(client_id);
> ```

**Bad**:
> This is slow. Fix it.

---

## Testing Requirements

### Test Coverage

**Required coverage**:
- Unit tests: 70%+ coverage
- Integration tests: 60%+ coverage
- Critical paths: 100% coverage (authentication, payments, KYC)

### Test Types

**Unit Tests** (required for):
- Utility functions
- Business logic
- Validation functions
- Calculations

**Integration Tests** (required for):
- API endpoints
- Database operations
- tRPC routers

**E2E Tests** (optional):
- Critical user flows
- Multi-step processes

### Writing Tests

**Example unit test**:
```typescript
import { describe, it, expect } from "vitest";
import { calculateProposalPrice } from "@/lib/pricing";

describe("calculateProposalPrice", () => {
  it("applies complexity multiplier correctly", () => {
    const price = calculateProposalPrice({
      basePrice: 1000,
      complexity: "average",  // 1.25x multiplier
    });

    expect(price).toBe(1250);
  });

  it("applies industry multiplier correctly", () => {
    const price = calculateProposalPrice({
      basePrice: 1000,
      industry: "construction",  // 1.2x multiplier
    });

    expect(price).toBe(1200);
  });
});
```

**Run tests**:
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/pricing.test.ts

# Run with coverage
pnpm test --coverage
```

---

## Documentation Requirements

### When Documentation is Required

**Always document**:
- New features (user-facing)
- API changes (breaking or non-breaking)
- Configuration options
- Database schema changes

**Update existing docs**:
- If behavior changes
- If new options added
- If deprecated features removed

### Documentation Types

**User Documentation** (`docs/user-guides/`):
- [STAFF_GUIDE.md](docs/user-guides/STAFF_GUIDE.md) - Staff workflows
- [CLIENT_ONBOARDING_GUIDE.md](docs/user-guides/CLIENT_ONBOARDING_GUIDE.md) - Client onboarding
- [ADMIN_TRAINING.md](docs/user-guides/ADMIN_TRAINING.md) - Admin features
- [FAQ.md](docs/user-guides/FAQ.md) - Common questions

**Developer Documentation**:
- [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) - New developer setup
- [CONTRIBUTING.md](CONTRIBUTING.md) - This file
- [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md) - Code standards
- [TROUBLESHOOTING_DEV.md](TROUBLESHOOTING_DEV.md) - Debugging

**Technical Reference**:
- [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - Configuration
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Database reference
- [ERROR_CODES.md](ERROR_CODES.md) - Error reference
- [INTEGRATIONS_REFERENCE.md](INTEGRATIONS_REFERENCE.md) - Third-party APIs

**Code Documentation**:
- JSDoc comments for complex functions
- Inline comments for non-obvious logic
- README.md in component directories (for large modules)

### Documentation Style

**Format**: Markdown

**Structure**:
```markdown
# Title

**Last Updated**: YYYY-MM-DD
**Version**: X.Y

Brief description.

---

## Table of Contents

1. [Section 1](#section-1)
2. [Section 2](#section-2)

---

## Section 1

Content here...

### Subsection 1.1

More content...

---

**Last Updated**: YYYY-MM-DD
**Maintained By**: Team Name
```

**Code examples**:
- Use syntax highlighting: ` ```typescript `
- Include comments for clarity
- Show complete, runnable examples

---

## Issue Guidelines

### Reporting Bugs

**Use the bug report template**:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., macOS 13.5]
- Browser: [e.g., Chrome 118]
- Version: [e.g., 1.0.0]

**Additional context**
Any other context about the problem.
```

### Feature Requests

**Use the feature request template**:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots.
```

### Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `duplicate` | Duplicate of existing issue |
| `wontfix` | Will not be worked on |
| `invalid` | Invalid issue |
| `question` | Further information requested |
| `enhancement` | Improvement to existing feature |
| `priority:high` | High priority |
| `priority:medium` | Medium priority |
| `priority:low` | Low priority |

---

## Community

### Communication Channels

**Internal Team**:
- **Slack**: `#practice-hub-dev` (development discussion)
- **Slack**: `#practice-hub-support` (support questions)
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussion, Q&A

**External Contributors**:
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussion, Q&A

### Getting Help

**If you're stuck**:
1. Check documentation (see [Resources](#resources))
2. Search existing issues
3. Ask in Slack `#practice-hub-dev` (internal) or GitHub Discussions (external)
4. Tag maintainers for urgent issues

### Resources

**Documentation**:
- [README.md](README.md) - Project overview
- [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) - Setup guide
- [CLAUDE.md](CLAUDE.md) - Development rules
- [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md) - Code standards
- [docs/](docs/) - Complete documentation

**External Resources**:
- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Better Auth Docs](https://www.better-auth.com/)

---

## Recognition

### Contributors

We recognize all contributors in:
- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- README.md (for major contributions)

### Hall of Fame

Outstanding contributors may be featured in our Hall of Fame for:
- Significant feature contributions
- Extensive bug fixes
- Major documentation improvements
- Community support

---

## License

By contributing to Practice Hub, you agree that your contributions will be licensed under the same license as the project.

---

## Questions?

If you have questions about contributing, please:
1. Check this guide first
2. Search GitHub Discussions
3. Ask in Slack `#practice-hub-dev`
4. Open a GitHub Discussion

**Thank you for contributing to Practice Hub! 🎉**

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
