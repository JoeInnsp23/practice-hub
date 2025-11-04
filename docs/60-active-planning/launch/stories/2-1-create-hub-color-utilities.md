# Story 2.1: Create Hub Color Utilities
**Story ID:** `2.1`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P0 (Critical)  
**Estimate:** 0.25 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Create centralized hub color constants and gradient utility functions.

---

## Tasks

1. Create `lib/utils/hub-colors.ts`
2. Define HUB_COLORS constant with all hub colors
3. Create getHubGradient function
4. Export TypeScript types for hub names
5. Add JSDoc comments

---

## Acceptance Criteria

- ✅ File exists at `lib/utils/hub-colors.ts`
- ✅ HUB_COLORS constant includes all 6 hubs (client-hub, admin, employee-hub, proposal-hub, social-hub, practice-hub)
- ✅ getHubGradient function returns correct gradient for each hub color
- ✅ Unknown colors default to blue gradient
- ✅ TypeScript types exported correctly

---

## Testing Requirements

- Unit: Test getHubGradient returns correct gradients for each hub color
- Unit: Test getHubGradient handles unknown colors gracefully
- Type: Verify TypeScript types work correctly

---

## Quality Gate

- ✅ Unit tests pass (90%+ coverage)
- ✅ Zero type errors
- ✅ Zero lint errors

---

## Dependencies

**Story Dependencies:** None  
**Epic Dependencies:** Epic 1.0 (uses CSS classes from enhanced-design.css)

---

## Files to Modify

- `lib/utils/hub-colors.ts` (new)

---

**Story Status:** Ready for Hephaestus Implementation

