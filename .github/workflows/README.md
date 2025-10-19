# GitHub Actions CI/CD Workflows

This directory contains automated workflows for continuous integration and deployment.

## Workflows

### CI Pipeline (`ci.yml`)

**Triggers**:
- Push to `main` branch
- Pull requests targeting `main`
- Manual dispatch (Actions tab → CI/CD Pipeline → Run workflow)

**Jobs**:

#### 1. Lint
- Runs Biome linter (`pnpm lint`)
- Checks code formatting (`pnpm run format:check`)
- **Timeout**: 5 minutes

#### 2. Type Check
- Runs TypeScript compiler in check mode
- Command: `pnpm run typecheck`
- **Timeout**: 5 minutes

#### 3. Unit Tests
- Runs Vitest test suite
- Uses PostgreSQL 17 service container
- Pushes schema to test database
- **Timeout**: 10 minutes
- **Test Database**: `practice_hub_test`

#### 4. Build
- Builds Next.js application with Turbopack
- Verifies `.next` output directory exists
- **Timeout**: 10 minutes

#### 5. Security Audit
- Runs `pnpm audit` for dependency vulnerabilities
- **Level**: High severity and above
- **Continues on error**: Does not block pipeline

#### 6. CI Success
- Summary job requiring all checks to pass
- Provides clear status output
- Blocks merge if any check fails

## Running Locally

### Run All CI Checks

```bash
# Lint
pnpm lint

# Format check
pnpm run format:check

# Type check
pnpm run typecheck

# Tests
pnpm test

# Build
pnpm build

# Security audit
pnpm audit --audit-level=high
```

### Run Individual Jobs

```bash
# Linting only
pnpm lint
pnpm run format:check

# Type checking only
pnpm run typecheck

# Tests only
pnpm test

# Build only
pnpm build
```

## CI Environment Variables

The CI pipeline uses these environment variables:

### Build & Test
```env
DATABASE_URL=postgresql://postgres:testpassword@localhost:5432/practice_hub_test
BETTER_AUTH_SECRET=test-secret-for-ci
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

**Note**: These are dummy values for CI only. Production values set in deployment platform.

## Fixing CI Failures

### Lint Failures

```bash
# Auto-fix linting issues
pnpm run lint:fix

# Auto-fix formatting
pnpm format
```

### Type Check Failures

```bash
# Run type check locally
pnpm run typecheck

# Common fixes:
# - Add missing types
# - Fix type mismatches
# - Update @types/* packages
```

### Test Failures

```bash
# Run tests locally
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Build Failures

```bash
# Run build locally
pnpm build

# Common issues:
# - Environment variables missing
# - Import errors
# - TypeScript errors (run typecheck first)
# - Missing dependencies (pnpm install)
```

## Branch Protection Rules

Recommended settings for `main` branch:

1. **Require status checks to pass**:
   - ✅ Lint
   - ✅ Type Check
   - ✅ Unit Tests
   - ✅ Build
   - ✅ CI Success

2. **Require branches to be up to date**: Yes

3. **Require pull request reviews**: 1 approval minimum

4. **Dismiss stale reviews**: Yes

5. **Require review from Code Owners**: Optional

Configure at: Repository → Settings → Branches → Add rule

## Adding New Jobs

To add a new job to the CI pipeline:

1. Edit `.github/workflows/ci.yml`
2. Add job definition:

```yaml
new-job:
  name: New Job Name
  runs-on: ubuntu-latest
  timeout-minutes: 5

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: ${{ env.PNPM_VERSION }}

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: "pnpm"

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run new command
      run: pnpm run new-command
```

3. Add to `ci-success` dependencies:

```yaml
ci-success:
  needs: [lint, typecheck, test, build, security-audit, new-job]
```

## Skipping CI

To skip CI on a commit (use sparingly):

```bash
git commit -m "docs: update README [skip ci]"
```

**Note**: `[skip ci]` in commit message skips entire pipeline.

## Caching

The workflow uses pnpm caching via `actions/setup-node@v4`:
- Dependencies cached per `pnpm-lock.yaml` hash
- Speeds up subsequent runs by ~2-3 minutes

## Troubleshooting

### Job Timeout

If a job times out:
1. Check if it's hanging on a specific step
2. Increase timeout if needed
3. Optimize the step (e.g., reduce test scope)

### PostgreSQL Connection Failures

If tests fail with "connection refused":
1. Ensure `services.postgres` is configured
2. Check health check is passing
3. Verify port mapping (5432:5432)

### Flaky Tests

If tests pass locally but fail in CI:
1. Check for timing issues (use `waitFor` in tests)
2. Verify environment variable differences
3. Check database state (ensure clean state per test)

## Performance Optimization

Current CI runtime (typical):
- **Lint**: ~30 seconds
- **Type Check**: ~45 seconds
- **Tests**: ~2 minutes
- **Build**: ~3 minutes
- **Security Audit**: ~15 seconds

**Total**: ~6-7 minutes

Ways to improve:
1. Parallelize more jobs (already parallelized)
2. Cache build artifacts
3. Use matrix strategy for multi-version testing (if needed)

## Security

### Secrets Management

**Never commit secrets to this repository!**

For CI secrets (future):
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add secrets (e.g., `SENTRY_AUTH_TOKEN`)
3. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Audit Logging

All workflow runs are logged:
- View: Actions tab → Select workflow → Select run
- Logs retained for 90 days
- Download logs for debugging

## Future Enhancements

Potential additions:
- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Deployment to staging on PR merge
- [ ] Deployment to production on release tag
- [ ] Automated dependency updates (Dependabot/Renovate)
- [ ] Code coverage reporting
- [ ] License compliance checks

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm Action](https://github.com/pnpm/action-setup)
- [PostgreSQL Service Container](https://docs.github.com/en/actions/using-containerized-services/creating-postgresql-service-containers)

---

**Last Updated**: 2025-10-19
**Status**: ✅ Active and running
