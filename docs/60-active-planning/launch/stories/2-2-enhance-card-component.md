# Story 2.2: Enhance Card Component
**Story ID:** `2.2`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P0 (Critical)  
**Estimate:** 0.5 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Add variant prop to Card component (default, elevated, interactive).

---

## Tasks

1. Update `components/ui/card.tsx`
2. Add variant prop using class-variance-authority
3. Create cardVariants with default, elevated, interactive variants
4. Update Card component to use variants
5. Test all variants render correctly

---

## Acceptance Criteria

- ✅ Card component accepts variant prop ("default" | "elevated" | "interactive")
- ✅ Default variant uses existing glass-card class
- ✅ Elevated variant applies shadow-medium class
- ✅ Interactive variant applies card-interactive class
- ✅ All variants work in dark mode

---

## Testing Requirements

- Unit: Test Card renders with each variant
- Unit: Test Card props work correctly
- Visual: Verify each variant applies correct styles
- Dark mode: Verify dark mode works for all variants

---

## Quality Gate

- ✅ Unit tests pass
- ✅ Zero type errors
- ✅ Visual verification
- ✅ Dark mode verified

---

## Dependencies

**Story Dependencies:** Story 1.1 (uses CSS classes)  
**Epic Dependencies:** Epic 1.0

---

## Files to Modify

- `components/ui/card.tsx` (modify)

---

**Story Status:** Ready for Hephaestus Implementation

