# Story 2.3: Create CardInteractive Component
**Story ID:** `2.3`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P0 (Critical)  
**Estimate:** 0.75 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Create new CardInteractive component with hover lift and gradient accent bar.

---

## Tasks

1. Create `components/ui/card-interactive.tsx`
2. Implement CardInteractive component with moduleColor prop
3. Use getHubGradient for gradient bar
4. Apply card-interactive CSS class
5. Add onClick handler support
6. Add accessibility (aria-label)
7. Test hover effects work

---

## Acceptance Criteria

- ✅ Component exists at `components/ui/card-interactive.tsx`
- ✅ Component accepts moduleColor prop (defaults to blue)
- ✅ Hover lift works (translateY -4px)
- ✅ Gradient bar slides in from left on hover (translateX -100% → 0%)
- ✅ Gradient uses hub color via getHubGradient
- ✅ onClick handler works if provided
- ✅ Accessibility: aria-label support
- ✅ Dark mode works correctly

---

## Testing Requirements

- Unit: Test CardInteractive renders correctly
- Unit: Test moduleColor prop applies gradient correctly
- Unit: Test onClick handler works
- Visual: Verify hover lift works (translateY -4px)
- Visual: Verify gradient bar slides in on hover
- Dark mode: Verify dark mode works

---

## Quality Gate

- ✅ Unit tests pass (90%+ coverage)
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Accessibility verified

---

## Dependencies

**Story Dependencies:** Story 2.1 (uses getHubGradient), Story 1.1 (uses CSS classes)  
**Epic Dependencies:** Epic 1.0

---

## Files to Modify

- `components/ui/card-interactive.tsx` (new)

---

**Story Status:** Ready for Hephaestus Implementation

