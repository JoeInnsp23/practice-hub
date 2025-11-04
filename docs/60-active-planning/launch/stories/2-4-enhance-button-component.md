# Story 2.4: Enhance Button Component
**Story ID:** `2.4`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P1 (High)  
**Estimate:** 0.5 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Add loading state and micro-interactions to Button component.

---

## Tasks

1. Update `components/ui/button.tsx`
2. Add isLoading prop
3. Add loadingText prop
4. Show spinner when loading (Loader2 icon with animate-spin)
5. Disable button when loading
6. Ensure button-feedback class applied (already in buttonVariants)
7. Test hover and active states

---

## Acceptance Criteria

- ✅ Button accepts isLoading prop
- ✅ Button accepts loadingText prop
- ✅ Spinner shows when isLoading is true
- ✅ Button disabled when loading
- ✅ Hover scale effect works (1.02)
- ✅ Active scale effect works (0.98)
- ✅ Focus ring visible and uses hub color

---

## Testing Requirements

- Unit: Test Button shows spinner when isLoading
- Unit: Test Button is disabled when loading
- Unit: Test loadingText displays correctly
- Visual: Verify hover scale works (1.02)
- Visual: Verify active scale works (0.98)
- Visual: Verify focus ring uses hub color when available

---

## Quality Gate

- ✅ Unit tests pass
- ✅ Visual verification
- ✅ Accessibility verified (disabled state)

---

## Dependencies

**Story Dependencies:** Story 1.1 (uses CSS classes)  
**Epic Dependencies:** Epic 1.0

---

## Files to Modify

- `components/ui/button.tsx` (modify)

---

**Story Status:** Ready for Hephaestus Implementation

