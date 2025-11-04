# Story 2.7: Enhance Table Component
**Story ID:** `2.7`  
**Epic ID:** `2.0` (Core Components)  
**Feature ID:** `ui-ux-polish-phase-2`  
**Status:** Pending  
**Priority:** P1 (High)  
**Estimate:** 0.5 days  
**Created:** 2025-01-03  
**Source:** TDD Plan  

---

## Description

Add row hover effects and empty state component.

---

## Tasks

1. Update table row styles in `app/enhanced-design.css`
2. Add table-row hover class
3. Add table-row-actions fade-in class
4. Create `components/ui/table-empty.tsx` component
5. Test row hover works
6. Test action buttons fade in on hover

---

## Acceptance Criteria

- ✅ Table rows have hover background change (200ms transition)
- ✅ Action buttons fade in on row hover (opacity 0 → 1)
- ✅ TableEmpty component created with icon and message
- ✅ Empty state displays when table has no data

---

## Testing Requirements

- Unit: Test TableEmpty component renders correctly
- Visual: Verify row hover background change works
- Visual: Verify action buttons fade in on row hover
- Visual: Verify empty state displays correctly

---

## Quality Gate

- ✅ Unit tests pass
- ✅ Visual verification
- ✅ Dark mode verified

---

## Dependencies

**Story Dependencies:** Story 1.1 (uses CSS classes)  
**Epic Dependencies:** Epic 1.0

---

## Files to Modify

- `app/enhanced-design.css` (modify)
- `components/ui/table-empty.tsx` (new)

---

**Story Status:** Ready for Hephaestus Implementation

