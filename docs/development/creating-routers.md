---
title: Creating tRPC Routers
description: Guide for creating new tRPC routers following conventions
audience: dev
status: complete
generated: HYBRID
---

# Creating tRPC Routers

<!-- BEGIN AI-GENERATED -->
**Current Routers**: {{repo-facts.routers.total}}
**Average Procedures per Router**: {{calculated:avg_procedures}}

**Common Patterns** (auto-detected):
- Input validation with Zod
- Protected procedures with `requireAuth()`
- Error handling with `TRPCError`

This section will be updated when router patterns change.
<!-- END AI-GENERATED -->

---

<!-- BEGIN CODE-EXTRACT: patterns/router-setup -->
**Placeholder**: Code-extracted documentation from `@doc:patterns/router-setup` tags will appear here.
<!-- END CODE-EXTRACT: patterns/router-setup -->

<!-- HUMAN-AUTHORED SECTION -->
## Step-by-Step Guide

### 1. Create Router File

Create `app/server/routers/your-feature.ts`:

```typescript
import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const yourFeatureRouter = router({
	// Add procedures here
});
```

### 2. Register in Root Router

Add to `app/server/routers/index.ts`:

```typescript
import { yourFeatureRouter } from "./your-feature";

export const appRouter = router({
	// ...
	yourFeature: yourFeatureRouter,
});
```

### 3. Test

See [Testing Guide](../testing/unit-testing.md) for router testing patterns.

## Related Documentation

- [API Reference](../reference/api/routers.md) - Complete router reference
- [Multi-Tenancy](../architecture/multi-tenancy.md) - Tenant isolation patterns
- [Authentication](../architecture/authentication.md) - Protected procedures
