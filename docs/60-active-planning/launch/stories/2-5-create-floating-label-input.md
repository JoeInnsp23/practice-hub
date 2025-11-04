# Story 2.5: Create FloatingLabelInput Component
**Story ID:** `2.5`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P1 (High)  
**Estimate:** 0.75 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Create FloatingLabelInput component with floating label pattern.

---

## Tasks

1. Create `components/ui/input-floating.tsx`
2. Implement floating label logic (moves up on focus/fill)
3. Add error prop and error message display
4. Add success prop and checkmark display
5. Add focus state animations
6. Add error shake animation
7. Test all states (default, focused, filled, error, success)

---

## Acceptance Criteria

- ✅ Component exists at `components/ui/input-floating.tsx`
- ✅ Label floats up smoothly on focus (200ms transition)
- ✅ Label floats up when input has value
- ✅ Error message displays below input with slide-down animation
- ✅ Success checkmark displays when success prop is true
- ✅ Error shake animation works on validation failure
- ✅ Focus ring uses hub color
- ✅ Accessibility: Label properly associated with input

---

## Testing Requirements

- Unit: Test FloatingLabelInput renders correctly
- Unit: Test label floats up on focus
- Unit: Test label floats up when value exists
- Unit: Test error message displays
- Unit: Test success checkmark displays
- Visual: Verify focus state animations
- Visual: Verify error shake animation
- Accessibility: Verify label association (htmlFor)

---

## Quality Gate

- ✅ Unit tests pass (90%+ coverage)
- ✅ Visual verification
- ✅ Accessibility verified (WCAG 2.1 AA)
- ✅ Dark mode verified

---

## Dependencies

**Story Dependencies:** Story 1.1 (uses CSS classes)  
**Epic Dependencies:** Epic 1.0

---

## Files to Modify

- `components/ui/input-floating.tsx` (new)

---

**Story Status:** Ready for Hephaestus Implementation

