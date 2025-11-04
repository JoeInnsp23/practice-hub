# Story 4.1: Redesign Login Page
**Story ID:** `4.1`  
**Epic ID:** `4.0` (Login & Landing)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P0 (Critical)  
**Estimate:** 0.75 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Redesign login page with professional layout and animations.

---

## Tasks

1. Update `app/(auth)/sign-in/page.tsx`
2. Redesign layout with better spacing
3. Use CardInteractive for main card
4. Use FloatingLabelInput for form fields
5. Add entrance animations (card lift, form stagger)
6. Enhance Microsoft OAuth button with loading state
7. Add error/success state handling
8. Test dark mode
9. Test mobile responsiveness

---

## Acceptance Criteria

- ✅ Login page redesigned with professional layout
- ✅ Card lifts in smoothly (animate-lift-in)
- ✅ Form elements stagger in sequentially
- ✅ FloatingLabelInput used for email/password
- ✅ Microsoft OAuth button has loading state
- ✅ Error messages display with slide-down animation
- ✅ Success state shows checkmark
- ✅ Dark mode works correctly
- ✅ Mobile responsive (touch-friendly, no zoom on focus)
- ✅ Keyboard navigation works

---

## Testing Requirements

- Visual: Verify login page looks professional
- Visual: Verify animations work (card lift, form stagger)
- Visual: Verify error states work
- Visual: Verify loading states work
- Mobile: Verify responsive on mobile
- Dark mode: Verify dark mode works
- Accessibility: Verify keyboard navigation works

---

## Quality Gate

- ✅ Visual verification
- ✅ Mobile responsive verified
- ✅ Dark mode verified
- ✅ Accessibility verified (WCAG 2.1 AA)

---

## Dependencies

**Story Dependencies:** Story 2.3 (CardInteractive), Story 2.5 (FloatingLabelInput)  
**Epic Dependencies:** Epic 2.0

---

## Files to Modify

- `app/(auth)/sign-in/page.tsx` (modify)

---

**Story Status:** Ready for Hephaestus Implementation

