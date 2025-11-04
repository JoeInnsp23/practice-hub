# Test-Driven Development Plan: UI/UX Polish Phase 2
**Feature ID:** `ui-ux-polish-phase-2`  
**Feature Name:** Enhanced Design System & UI Polish  
**Status:** Ready for Epic Planning  
**Created:** 2025-01-03  
**TDD Architect:** Hermes 📜  
**Source:** PRD (`ui-ux-polish-prd.md`)  

---

## Overview

**Total Estimated Effort:** 12-14 days  
**Number of Phases:** 6  
**Total Stories:** 24  
**Parallelization Opportunities:** Limited (sequential dependencies)  
**Complexity:** Medium-High (broad scope, all hubs affected)

**Dependency Analysis:**
- Phase 1 (Foundation) MUST complete first (CSS file foundation)
- Phase 2 (Core Components) depends on Phase 1 (uses CSS classes)
- Phase 3 (Hub Layouts) depends on Phase 2 (uses new components)
- Phase 4 (Login & Landing) depends on Phase 2 (uses new components)
- Phase 5 (Polish & Testing) depends on Phases 1-4 (tests all enhancements)
- Phase 6 (Browser Testing) depends on Phase 5 (final validation)

**Parallelization Recommendation:**
- Phase 4 (Login & Landing) can run parallel with Phase 3 (Hub Layouts) if resources allow
- No file conflicts expected (different file locations)
- Phase 3 stories can be parallelized by hub (different hubs, no conflicts)

---

## Development Phases

### Phase 1: Foundation (2 days)
**Goal:** Create enhanced design system CSS file with all utility classes

**Dependencies:** None (foundation phase)

**Stories:**

#### Story 1.1: Create Enhanced Design CSS File
**Story ID:** `1.1`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Create `app/enhanced-design.css` file with complete shadow system, animation keyframes, and utility classes.

**Tasks:**
1. Create `app/enhanced-design.css` file
2. Add shadow system classes (soft, medium, strong, elevated) with light mode variants
3. Add dark mode shadow variants
4. Add animation keyframes (fadeIn, slideIn, liftIn, shimmer, spin)
5. Add animation utility classes (animate-fade-in, animate-slide-in, animate-lift-in)
6. Add micro-interaction classes (hover-lift, button-feedback)
7. Add shimmer skeleton class
8. Import file into `app/globals.css`

**Tests Required:**
- Visual: Verify classes available in browser DevTools
- Manual: Apply classes to test elements, verify shadows render correctly
- Manual: Test animations work in browser
- Dark mode: Verify dark mode variants work

**Acceptance Criteria:**
- ✅ File exists at `app/enhanced-design.css`
- ✅ Import statement added to `globals.css`: `@import "./enhanced-design.css";`
- ✅ All shadow classes available (.shadow-soft, .shadow-medium, .shadow-strong, .shadow-elevated)
- ✅ All animation keyframes defined (@keyframes fadeIn, slideIn, liftIn, shimmer, spin)
- ✅ All utility classes available (.animate-fade-in, .animate-slide-in, .animate-lift-in, .hover-lift, .button-feedback)
- ✅ Dark mode variants work correctly
- ✅ `prefers-reduced-motion` respected (animations disabled)

**Quality Gate:**
- ✅ Zero lint errors
- ✅ Zero type errors
- ✅ Visual verification in browser
- ✅ Dark mode verified

---

#### Story 1.2: Document Enhanced Design System
**Story ID:** `1.2`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Document all new classes and patterns in design system documentation.

**Tasks:**
1. Create `docs/design/enhanced-design-system.md`
2. Document shadow system (usage, examples)
3. Document animation keyframes (when to use each)
4. Document utility classes (usage examples)
5. Document dark mode considerations
6. Add code examples for each class

**Tests Required:**
- Documentation review: Verify completeness
- Code examples: Verify examples work

**Acceptance Criteria:**
- ✅ Documentation file created
- ✅ All classes documented with usage examples
- ✅ Dark mode considerations documented
- ✅ Code examples provided for each pattern

**Quality Gate:**
- ✅ Documentation complete and accurate
- ✅ Code examples verified

---

#### Story 1.3: Archive Pattern Extraction Documentation
**Story ID:** `1.3`  
**Estimate:** 1 day  
**Priority:** P1 (High)

**Description:**
Document extracted patterns from archive, showing what was adopted vs. rejected.

**Tasks:**
1. Create `docs/design/archive-design-patterns.md`
2. Document shadow system extraction (archive → new system)
3. Document animation pattern extraction
4. Document card hover pattern extraction
5. Document typography patterns
6. Document what was REJECTED (Innspired branding, orange colors)
7. Show before/after comparisons

**Tests Required:**
- Documentation review: Verify patterns match archive
- Visual comparison: Verify extracted patterns correct

**Acceptance Criteria:**
- ✅ Documentation file created
- ✅ All extracted patterns documented
- ✅ Rejected patterns clearly marked (branding, orange colors)
- ✅ Before/after comparisons shown
- ✅ Pattern vs. branding separation clear

**Quality Gate:**
- ✅ Documentation accurate
- ✅ Patterns align with archive

---

### Phase 2: Core Components (3 days)
**Goal:** Enhance existing components and create new component variants

**Dependencies:** Phase 1 (uses CSS classes from enhanced-design.css)

**Stories:**

#### Story 2.1: Create Hub Color Utilities
**Story ID:** `2.1`  
**Estimate:** 0.25 days  
**Priority:** P0 (Critical)

**Description:**
Create centralized hub color constants and gradient utility functions.

**Tasks:**
1. Create `lib/utils/hub-colors.ts`
2. Define HUB_COLORS constant with all hub colors
3. Create getHubGradient function
4. Export TypeScript types for hub names
5. Add JSDoc comments

**Tests Required:**
- Unit: Test getHubGradient returns correct gradients for each hub color
- Unit: Test getHubGradient handles unknown colors gracefully
- Type: Verify TypeScript types work correctly

**Acceptance Criteria:**
- ✅ File exists at `lib/utils/hub-colors.ts`
- ✅ HUB_COLORS constant includes all 6 hubs (client-hub, admin, employee-hub, proposal-hub, social-hub, practice-hub)
- ✅ getHubGradient function returns correct gradient for each hub color
- ✅ Unknown colors default to blue gradient
- ✅ TypeScript types exported correctly

**Quality Gate:**
- ✅ Unit tests pass (90%+ coverage)
- ✅ Zero type errors
- ✅ Zero lint errors

---

#### Story 2.2: Enhance Card Component
**Story ID:** `2.2`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Add variant prop to Card component (default, elevated, interactive).

**Tasks:**
1. Update `components/ui/card.tsx`
2. Add variant prop using class-variance-authority
3. Create cardVariants with default, elevated, interactive variants
4. Update Card component to use variants
5. Test all variants render correctly

**Tests Required:**
- Unit: Test Card renders with each variant
- Unit: Test Card props work correctly
- Visual: Verify each variant applies correct styles
- Dark mode: Verify dark mode works for all variants

**Acceptance Criteria:**
- ✅ Card component accepts variant prop ("default" | "elevated" | "interactive")
- ✅ Default variant uses existing glass-card class
- ✅ Elevated variant applies shadow-medium class
- ✅ Interactive variant applies card-interactive class
- ✅ All variants work in dark mode

**Quality Gate:**
- ✅ Unit tests pass
- ✅ Zero type errors
- ✅ Visual verification
- ✅ Dark mode verified

---

#### Story 2.3: Create CardInteractive Component
**Story ID:** `2.3`  
**Estimate:** 0.75 days  
**Priority:** P0 (Critical)

**Description:**
Create new CardInteractive component with hover lift and gradient accent bar.

**Tasks:**
1. Create `components/ui/card-interactive.tsx`
2. Implement CardInteractive component with moduleColor prop
3. Use getHubGradient for gradient bar
4. Apply card-interactive CSS class
5. Add onClick handler support
6. Add accessibility (aria-label)
7. Test hover effects work

**Tests Required:**
- Unit: Test CardInteractive renders correctly
- Unit: Test moduleColor prop applies gradient correctly
- Unit: Test onClick handler works
- Visual: Verify hover lift works (translateY -4px)
- Visual: Verify gradient bar slides in on hover
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Component exists at `components/ui/card-interactive.tsx`
- ✅ Component accepts moduleColor prop (defaults to blue)
- ✅ Hover lift works (translateY -4px)
- ✅ Gradient bar slides in from left on hover (translateX -100% → 0%)
- ✅ Gradient uses hub color via getHubGradient
- ✅ onClick handler works if provided
- ✅ Accessibility: aria-label support
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Unit tests pass (90%+ coverage)
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Accessibility verified

---

#### Story 2.4: Enhance Button Component
**Story ID:** `2.4`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Add loading state and micro-interactions to Button component.

**Tasks:**
1. Update `components/ui/button.tsx`
2. Add isLoading prop
3. Add loadingText prop
4. Show spinner when loading (Loader2 icon with animate-spin)
5. Disable button when loading
6. Ensure button-feedback class applied (already in buttonVariants)
7. Test hover and active states

**Tests Required:**
- Unit: Test Button shows spinner when isLoading
- Unit: Test Button is disabled when loading
- Unit: Test loadingText displays correctly
- Visual: Verify hover scale works (1.02)
- Visual: Verify active scale works (0.98)
- Visual: Verify focus ring uses hub color when available

**Acceptance Criteria:**
- ✅ Button accepts isLoading prop
- ✅ Button accepts loadingText prop
- ✅ Spinner shows when isLoading is true
- ✅ Button disabled when loading
- ✅ Hover scale effect works (1.02)
- ✅ Active scale effect works (0.98)
- ✅ Focus ring visible and uses hub color

**Quality Gate:**
- ✅ Unit tests pass
- ✅ Visual verification
- ✅ Accessibility verified (disabled state)

---

#### Story 2.5: Create FloatingLabelInput Component
**Story ID:** `2.5`  
**Estimate:** 0.75 days  
**Priority:** P1 (High)

**Description:**
Create FloatingLabelInput component with floating label pattern.

**Tasks:**
1. Create `components/ui/input-floating.tsx`
2. Implement floating label logic (moves up on focus/fill)
3. Add error prop and error message display
4. Add success prop and checkmark display
5. Add focus state animations
6. Add error shake animation
7. Test all states (default, focused, filled, error, success)

**Tests Required:**
- Unit: Test FloatingLabelInput renders correctly
- Unit: Test label floats up on focus
- Unit: Test label floats up when value exists
- Unit: Test error message displays
- Unit: Test success checkmark displays
- Visual: Verify focus state animations
- Visual: Verify error shake animation
- Accessibility: Verify label association (htmlFor)

**Acceptance Criteria:**
- ✅ Component exists at `components/ui/input-floating.tsx`
- ✅ Label floats up smoothly on focus (200ms transition)
- ✅ Label floats up when input has value
- ✅ Error message displays below input with slide-down animation
- ✅ Success checkmark displays when success prop is true
- ✅ Error shake animation works on validation failure
- ✅ Focus ring uses hub color
- ✅ Accessibility: Label properly associated with input

**Quality Gate:**
- ✅ Unit tests pass (90%+ coverage)
- ✅ Visual verification
- ✅ Accessibility verified (WCAG 2.1 AA)
- ✅ Dark mode verified

---

#### Story 2.6: Create Skeleton Components
**Story ID:** `2.6`  
**Estimate:** 0.75 days  
**Priority:** P1 (High)

**Description:**
Create skeleton loading components for all content types.

**Tasks:**
1. Enhance `components/ui/skeleton.tsx` with shimmer variant
2. Create `components/ui/skeleton-card.tsx`
3. Create `components/ui/skeleton-table.tsx`
4. Create `components/ui/skeleton-text.tsx`
5. Create `components/ui/skeleton-avatar.tsx`
6. Create `components/ui/skeleton-widget.tsx`
7. Test shimmer animation works
8. Test dark mode variants

**Tests Required:**
- Unit: Test all skeleton components render correctly
- Unit: Test shimmer variant applies correctly
- Visual: Verify shimmer animation runs smoothly (60fps)
- Visual: Verify skeletons match content shapes
- Dark mode: Verify dark mode colors work

**Acceptance Criteria:**
- ✅ Skeleton component enhanced with shimmer variant
- ✅ SkeletonCard component created
- ✅ SkeletonTable component created (5 rows)
- ✅ SkeletonText component created
- ✅ SkeletonAvatar component created
- ✅ SkeletonWidget component created
- ✅ Shimmer animation runs smoothly (60fps)
- ✅ Dark mode variants use appropriate muted colors

**Quality Gate:**
- ✅ Unit tests pass
- ✅ Visual verification
- ✅ Performance: Shimmer animation 60fps
- ✅ Dark mode verified

---

#### Story 2.7: Enhance Table Component
**Story ID:** `2.7`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Add row hover effects and empty state component.

**Tasks:**
1. Update table row styles in `app/enhanced-design.css`
2. Add table-row hover class
3. Add table-row-actions fade-in class
4. Create `components/ui/table-empty.tsx` component
5. Test row hover works
6. Test action buttons fade in on hover

**Tests Required:**
- Unit: Test TableEmpty component renders correctly
- Visual: Verify row hover background change works
- Visual: Verify action buttons fade in on row hover
- Visual: Verify empty state displays correctly

**Acceptance Criteria:**
- ✅ Table rows have hover background change (200ms transition)
- ✅ Action buttons fade in on row hover (opacity 0 → 1)
- ✅ TableEmpty component created with icon and message
- ✅ Empty state displays when table has no data

**Quality Gate:**
- ✅ Unit tests pass
- ✅ Visual verification
- ✅ Dark mode verified

---

### Phase 3: Hub Layouts (3 days)
**Goal:** Polish all hub layouts with enhanced components and styles

**Dependencies:** Phase 2 (uses new components)

**Parallelization:** Stories 3.1-3.6 can run in parallel (different hubs, no file conflicts)

**Stories:**

#### Story 3.1: Polish Practice Hub Dashboard
**Story ID:** `3.1`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Apply enhanced design system to Practice Hub dashboard.

**Tasks:**
1. Update Practice Hub dashboard to use CardInteractive
2. Apply shadow system to cards
3. Add entrance animations (stagger cards)
4. Update widgets with count-up animations
5. Test hub color (default blue) displays correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify cards have enhanced shadows
- Visual: Verify cards stagger in on load
- Visual: Verify hover effects work
- Visual: Verify hub color correct (default blue)
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Dashboard cards use CardInteractive component
- ✅ Cards have multi-layer shadows
- ✅ Cards stagger in sequentially on load
- ✅ Hover lift effects work
- ✅ Hub color displays correctly in header/sidebar
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub color verified

---

#### Story 3.2: Polish Client Hub Layouts
**Story ID:** `3.2`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Apply enhanced design system to Client Hub layouts.

**Tasks:**
1. Update Client Hub pages to use enhanced components
2. Apply CardInteractive to client cards
3. Enhance client table with row hover
4. Update forms with FloatingLabelInput where appropriate
5. Test hub color (blue #3b82f6) displays correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify Client Hub pages polished
- Visual: Verify hub color correct (blue #3b82f6)
- Visual: Verify table row hover works
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Client Hub pages use enhanced components
- ✅ Client cards use CardInteractive with blue gradient
- ✅ Client table has row hover effects
- ✅ Forms use FloatingLabelInput where appropriate
- ✅ Hub color displays correctly in header/sidebar
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub color verified

---

#### Story 3.3: Polish Admin Hub Layouts
**Story ID:** `3.3`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Apply enhanced design system to Admin Hub layouts.

**Tasks:**
1. Update Admin Hub pages to use enhanced components
2. Apply CardInteractive with orange gradient
3. Enhance user management table
4. Update forms with FloatingLabelInput
5. Test hub color (orange #f97316) displays correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify Admin Hub pages polished
- Visual: Verify hub color correct (orange #f97316)
- Visual: Verify table enhancements work
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Admin Hub pages use enhanced components
- ✅ Cards use CardInteractive with orange gradient
- ✅ Tables have row hover effects
- ✅ Forms use FloatingLabelInput
- ✅ Hub color displays correctly in header/sidebar (orange)
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub color verified

---

#### Story 3.4: Polish Employee Hub Layouts
**Story ID:** `3.4`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Apply enhanced design system to Employee Hub layouts (when Employee Hub created).

**Tasks:**
1. Update Employee Hub pages to use enhanced components
2. Apply CardInteractive with emerald gradient
3. Enhance timesheet and leave interfaces
4. Update forms with FloatingLabelInput
5. Test hub color (emerald #10b981) displays correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify Employee Hub pages polished
- Visual: Verify hub color correct (emerald #10b981)
- Visual: Verify enhancements work
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Employee Hub pages use enhanced components
- ✅ Cards use CardInteractive with emerald gradient
- ✅ Interfaces polished consistently
- ✅ Hub color displays correctly in header/sidebar (emerald)
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub color verified

**Note:** This story may be blocked if Employee Hub not yet created. Can be completed when Employee Hub is ready.

---

#### Story 3.5: Polish Proposal Hub Layouts
**Story ID:** `3.5`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Apply enhanced design system to Proposal Hub layouts.

**Tasks:**
1. Update Proposal Hub pages to use enhanced components
2. Apply CardInteractive with pink gradient
3. Enhance proposal interfaces
4. Update forms with FloatingLabelInput
5. Test hub color (pink #ec4899) displays correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify Proposal Hub pages polished
- Visual: Verify hub color correct (pink #ec4899)
- Visual: Verify enhancements work
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Proposal Hub pages use enhanced components
- ✅ Cards use CardInteractive with pink gradient
- ✅ Interfaces polished consistently
- ✅ Hub color displays correctly in header/sidebar (pink)
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub color verified

---

#### Story 3.6: Polish Social Hub & Client Portal Layouts
**Story ID:** `3.6`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Apply enhanced design system to Social Hub and Client Portal layouts.

**Tasks:**
1. Update Social Hub pages (purple gradient)
2. Update Client Portal pages
3. Apply CardInteractive where appropriate
4. Enhance forms and tables
5. Test hub colors display correctly
6. Test dark mode

**Tests Required:**
- Visual: Verify Social Hub pages polished (purple #8b5cf6)
- Visual: Verify Client Portal pages polished
- Dark mode: Verify dark mode works

**Acceptance Criteria:**
- ✅ Social Hub pages use enhanced components (purple gradient)
- ✅ Client Portal pages polished consistently
- ✅ Hub colors display correctly
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Dark mode verified
- ✅ Hub colors verified

---

### Phase 4: Login & Landing (1.5 days)
**Goal:** Redesign login page and create landing page

**Dependencies:** Phase 2 (uses FloatingLabelInput, CardInteractive)

**Stories:**

#### Story 4.1: Redesign Login Page
**Story ID:** `4.1`  
**Estimate:** 0.75 days  
**Priority:** P0 (Critical)

**Description:**
Redesign login page with professional layout and animations.

**Tasks:**
1. Update `app/(auth)/sign-in/page.tsx`
2. Redesign layout with better spacing
3. Use CardInteractive for main card
4. Use FloatingLabelInput for form fields
5. Add entrance animations (card lift, form stagger)
6. Enhance Microsoft OAuth button with loading state
7. Add error/success state handling
8. Test dark mode
9. Test mobile responsiveness

**Tests Required:**
- Visual: Verify login page looks professional
- Visual: Verify animations work (card lift, form stagger)
- Visual: Verify error states work
- Visual: Verify loading states work
- Mobile: Verify responsive on mobile
- Dark mode: Verify dark mode works
- Accessibility: Verify keyboard navigation works

**Acceptance Criteria:**
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

**Quality Gate:**
- ✅ Visual verification
- ✅ Mobile responsive verified
- ✅ Dark mode verified
- ✅ Accessibility verified (WCAG 2.1 AA)

---

#### Story 4.2: Create Landing Page
**Story ID:** `4.2`  
**Estimate:** 0.75 days  
**Priority:** P0 (Critical)

**Description:**
Create professional landing page for unauthenticated users.

**Tasks:**
1. Create `app/page.tsx`
2. Add authenticated redirect logic (redirect to `/practice-hub`)
3. Create hero section with fadeIn animation
4. Create features section (4 main hubs with CardInteractive)
5. Create benefits section (3-4 key benefits)
6. Create trust/credibility section
7. Create footer with links
8. Add scroll animations (sections lift on scroll)
9. Test unauthenticated users see landing page
10. Test authenticated users redirect correctly
11. Test mobile responsiveness

**Tests Required:**
- Functional: Verify unauthenticated users see landing page
- Functional: Verify authenticated users redirect to `/practice-hub`
- Visual: Verify hero fades in
- Visual: Verify sections lift on scroll
- Visual: Verify CTAs work
- Mobile: Verify responsive on mobile
- Dark mode: Verify dark mode works
- Accessibility: Verify skip link, headings, alt text

**Acceptance Criteria:**
- ✅ Landing page exists at `app/page.tsx`
- ✅ Unauthenticated users see landing page
- ✅ Authenticated users redirect to `/practice-hub`
- ✅ Hero section fades in on load
- ✅ Features section shows 4 main hubs with icons
- ✅ Benefits section displays 3-4 key benefits
- ✅ Trust section displays security/compliance info
- ✅ Sections lift in on scroll (Intersection Observer)
- ✅ CTAs clear and prominent
- ✅ Mobile responsive (cards stack)
- ✅ Dark mode works correctly
- ✅ Accessible (skip link, proper headings, alt text)

**Quality Gate:**
- ✅ Functional verification (redirect works)
- ✅ Visual verification
- ✅ Mobile responsive verified
- ✅ Dark mode verified
- ✅ Accessibility verified (WCAG 2.1 AA)

---

### Phase 5: Polish & Testing (2 days)
**Goal:** Final polish and comprehensive testing

**Dependencies:** Phases 1-4 (tests all enhancements)

**Stories:**

#### Story 5.1: Modal/Dialog Animations
**Story ID:** `5.1`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Enhance modal/dialog components with smooth animations.

**Tasks:**
1. Update Dialog components to use animate-lift-in
2. Add backdrop blur effect
3. Ensure focus trap works
4. Test keyboard navigation (Escape key)
5. Test all modal sizes (sm, md, lg, xl)
6. Test dark mode

**Tests Required:**
- Visual: Verify modal entrance animation smooth (300ms)
- Visual: Verify backdrop blur works
- Functional: Verify Escape key closes modal
- Functional: Verify focus trap works
- Accessibility: Verify keyboard navigation works

**Acceptance Criteria:**
- ✅ Modal entrance feels smooth (300ms liftIn animation)
- ✅ Backdrop blur enhances visual hierarchy
- ✅ Escape key closes modal
- ✅ Focus trap keeps focus inside modal
- ✅ All modal sizes animate consistently
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Functional verification
- ✅ Accessibility verified
- ✅ Dark mode verified

---

#### Story 5.2: Navigation Enhancements (Sidebar)
**Story ID:** `5.2`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Enhance sidebar with active state polish and collapse animation.

**Tasks:**
1. Update `components/shared/GlobalSidebar.tsx`
2. Enhance active state (colored left border, background highlight)
3. Add smooth collapse/expand animation
4. Add collapse/expand button
5. Persist collapse state in localStorage
6. Test all hub colors work correctly
7. Test mobile drawer behavior

**Tests Required:**
- Visual: Verify active state clearly indicates current page
- Visual: Verify collapse/expand animation smooth (300ms)
- Visual: Verify each hub's color shows correctly
- Functional: Verify collapse state persists
- Mobile: Verify sidebar becomes drawer on mobile

**Acceptance Criteria:**
- ✅ Active state has colored left border (4px) with hub color
- ✅ Active state has background highlight
- ✅ Collapse/expand animation smooth (300ms)
- ✅ Collapse state persists in localStorage
- ✅ Each hub's color shows correctly in sidebar
- ✅ Mobile: Sidebar becomes drawer with slide animation
- ✅ Dark mode works correctly

**Quality Gate:**
- ✅ Visual verification
- ✅ Functional verification
- ✅ Hub colors verified
- ✅ Dark mode verified

---

#### Story 5.3: Widget/KPI Count-Up Animations
**Story ID:** `5.3`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Add number count-up animations and enable Recharts animations.

**Tasks:**
1. Create `hooks/use-count-up.ts` hook
2. Update KPI widgets to use count-up hook
3. Enable Recharts animations in chart components
4. Test count-up animations work smoothly
5. Test chart animations work
6. Test performance (60fps)

**Tests Required:**
- Unit: Test useCountUp hook counts correctly
- Unit: Test useCountUp stops at target value
- Visual: Verify numbers count up smoothly
- Visual: Verify Recharts animations work
- Performance: Verify animations don't block main thread

**Acceptance Criteria:**
- ✅ useCountUp hook created and working
- ✅ KPI widgets use count-up animation
- ✅ Numbers count up smoothly (smooth counting effect)
- ✅ Recharts animations enabled (if supported)
- ✅ Animations run at 60fps
- ✅ Performance: Animations don't block interaction

**Quality Gate:**
- ✅ Unit tests pass (90%+ coverage)
- ✅ Visual verification
- ✅ Performance verified (60fps)

---

#### Story 5.4: Visual Regression Testing
**Story ID:** `5.4`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Perform visual regression testing with Cursor browser tools.

**Tasks:**
1. Screenshot each hub before/after (Practice, Client, Admin, Employee, Proposal, Social)
2. Screenshot login page before/after
3. Screenshot landing page
4. Test in light mode + dark mode
5. Test on desktop, tablet, mobile viewports
6. Document any visual issues found

**Tests Required:**
- Visual: Screenshot all hubs (before/after comparison)
- Visual: Screenshot login page (before/after)
- Visual: Screenshot landing page
- Visual: Test light mode
- Visual: Test dark mode
- Visual: Test all viewports

**Acceptance Criteria:**
- ✅ Screenshots taken for all hubs
- ✅ Screenshots taken for login page
- ✅ Screenshots taken for landing page
- ✅ Light mode and dark mode tested
- ✅ Desktop, tablet, mobile viewports tested
- ✅ Visual issues documented

**Quality Gate:**
- ✅ Visual regression complete
- ✅ All screenshots captured
- ✅ Issues documented

---

#### Story 5.5: Performance Testing
**Story ID:** `5.5`  
**Estimate:** 0.25 days  
**Priority:** P0 (Critical)

**Description:**
Test animation performance and layout shift.

**Tasks:**
1. Measure FPS during animations (target: 60fps)
2. Test on mid-range devices (not just high-end)
3. Measure CLS (Cumulative Layout Shift) - target: < 0.1
4. Ensure animations don't block interaction
5. Document performance results

**Tests Required:**
- Performance: Measure FPS during animations
- Performance: Test on mid-range devices
- Performance: Measure CLS
- Performance: Test animations don't block interaction

**Acceptance Criteria:**
- ✅ Animations run at 60fps on target devices
- ✅ CLS < 0.1 (loading skeletons prevent layout shift)
- ✅ Animations don't block interaction
- ✅ Performance acceptable on mid-range devices

**Quality Gate:**
- ✅ Performance targets met (60fps, CLS < 0.1)
- ✅ Performance verified on mid-range devices

---

#### Story 5.6: Accessibility Audit
**Story ID:** `5.6`  
**Estimate:** 0.25 days  
**Priority:** P0 (Critical)

**Description:**
Perform comprehensive accessibility audit.

**Tasks:**
1. Test keyboard navigation through all interactive elements
2. Test screen reader compatibility (VoiceOver, NVDA)
3. Check color contrast (all text, all backgrounds)
4. Verify focus visible in all states
5. Verify `prefers-reduced-motion` respected
6. Run automated accessibility testing (axe-core)
7. Document any issues found

**Tests Required:**
- Accessibility: Keyboard navigation test
- Accessibility: Screen reader test (VoiceOver, NVDA)
- Accessibility: Color contrast checker
- Accessibility: Focus visible test
- Accessibility: Reduced motion test
- Accessibility: Automated testing (axe-core)

**Acceptance Criteria:**
- ✅ Keyboard navigation works flawlessly
- ✅ Screen reader compatible (VoiceOver, NVDA)
- ✅ Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- ✅ Focus visible in all states
- ✅ `prefers-reduced-motion` respected (animations disabled)
- ✅ Zero accessibility violations (axe-core)

**Quality Gate:**
- ✅ Accessibility audit complete
- ✅ WCAG 2.1 AA compliance verified
- ✅ Zero violations

---

### Phase 6: Browser Testing & Iteration (1 day)
**Goal:** Final validation and fixes

**Dependencies:** Phase 5 (tests all enhancements)

**Stories:**

#### Story 6.1: Cross-Browser Testing
**Story ID:** `6.1`  
**Estimate:** 0.5 days  
**Priority:** P0 (Critical)

**Description:**
Test on all target browsers and devices.

**Tasks:**
1. Test on Chrome (latest 2 versions)
2. Test on Firefox (latest 2 versions)
3. Test on Safari (latest 2 versions)
4. Test on Edge (latest 2 versions)
5. Test on Mobile Safari (iOS, latest 2 versions)
6. Test on Chrome Mobile (Android, latest 2 versions)
7. Document any browser-specific issues
8. Fix critical issues

**Tests Required:**
- Browser: Test all target browsers
- Browser: Test all devices
- Browser: Document browser-specific issues
- Browser: Fix critical issues

**Acceptance Criteria:**
- ✅ All target browsers tested
- ✅ All devices tested
- ✅ Critical issues fixed
- ✅ Browser-specific issues documented
- ✅ Graceful degradation for older browsers

**Quality Gate:**
- ✅ All browsers tested
- ✅ Critical issues resolved

---

#### Story 6.2: Final Polish & Documentation
**Story ID:** `6.2`  
**Estimate:** 0.5 days  
**Priority:** P1 (High)

**Description:**
Final polish based on visual review and complete documentation.

**Tasks:**
1. Review all visual enhancements
2. Fix any remaining polish issues
3. Update component documentation
4. Update design system documentation
5. Create animation guide (`docs/design/animation-guide.md`)
6. Final commit and summary

**Tests Required:**
- Documentation: Verify all docs complete
- Visual: Final visual review

**Acceptance Criteria:**
- ✅ All visual enhancements polished
- ✅ Component documentation updated
- ✅ Design system documentation complete
- ✅ Animation guide created
- ✅ All documentation accurate

**Quality Gate:**
- ✅ Documentation complete
- ✅ Visual review complete

---

## Epic Structure (for Prometheus)

Based on dependency analysis, I recommend the following epic structure:

### Sequential Option (Default - Safest)
**Total Time:** 12-14 days

- **Epic 1.0: Foundation** (2 days) - Sequential
  - Story 1.1: Create Enhanced Design CSS File
  - Story 1.2: Document Enhanced Design System
  - Story 1.3: Archive Pattern Extraction Documentation

- **Epic 2.0: Core Components** (3 days) - Sequential
  - Story 2.1: Create Hub Color Utilities
  - Story 2.2: Enhance Card Component
  - Story 2.3: Create CardInteractive Component
  - Story 2.4: Enhance Button Component
  - Story 2.5: Create FloatingLabelInput Component
  - Story 2.6: Create Skeleton Components
  - Story 2.7: Enhance Table Component

- **Epic 3.0: Hub Layouts** (3 days) - **PARALLEL** (by hub)
  - Story 3.1: Polish Practice Hub Dashboard
  - Story 3.2: Polish Client Hub Layouts (parallel)
  - Story 3.3: Polish Admin Hub Layouts (parallel)
  - Story 3.4: Polish Employee Hub Layouts (parallel)
  - Story 3.5: Polish Proposal Hub Layouts (parallel)
  - Story 3.6: Polish Social Hub & Client Portal Layouts (parallel)

- **Epic 4.0: Login & Landing** (1.5 days) - Sequential
  - Story 4.1: Redesign Login Page
  - Story 4.2: Create Landing Page

- **Epic 5.0: Polish & Testing** (2 days) - Sequential
  - Story 5.1: Modal/Dialog Animations
  - Story 5.2: Navigation Enhancements (Sidebar)
  - Story 5.3: Widget/KPI Count-Up Animations
  - Story 5.4: Visual Regression Testing
  - Story 5.5: Performance Testing
  - Story 5.6: Accessibility Audit

- **Epic 6.0: Browser Testing & Iteration** (1 day) - Sequential
  - Story 6.1: Cross-Browser Testing
  - Story 6.2: Final Polish & Documentation

### Parallelization Opportunity (Faster)
**Total Time:** 10-12 days (if resources allow)

**Epic 3.0 Hub Layouts can be parallelized:**
- Stories 3.1-3.6 can run in parallel (different hubs, no file conflicts)
- **Time Savings:** 2-3 days (if 2-3 developers work in parallel)

**Epic 4.0 can run parallel with Epic 3.0:**
- Login & Landing (Epic 4.0) can run parallel with Hub Layouts (Epic 3.0)
- **Time Savings:** 1.5 days (if resources allow)

**Total Parallelization Savings:** 3.5-4.5 days

**Recommendation:** Start with sequential option. If resources allow, parallelize Epic 3.0 (hub layouts) as it's the safest parallelization (different files, no conflicts).

**Prometheus, please validate:**
1. Can Epic 3.0 stories (3.1-3.6) truly run parallel? (Different hubs, no file conflicts?)
2. Can Epic 4.0 run parallel with Epic 3.0? (Different file locations?)
3. Are there any other parallelization opportunities?

---

## Quality Gates

Each phase must pass these quality gates before proceeding:

### Phase 1 Quality Gate
- ✅ Enhanced design CSS file created and imported
- ✅ All classes available in browser DevTools
- ✅ Dark mode variants work
- ✅ Documentation complete
- ✅ Zero lint errors
- ✅ Zero type errors

### Phase 2 Quality Gate
- ✅ All components created/enhanced
- ✅ All components render correctly
- ✅ Props work as expected
- ✅ Dark mode supported
- ✅ Accessibility verified
- ✅ Unit tests pass (90%+ coverage where applicable)
- ✅ Zero lint errors
- ✅ Zero type errors

### Phase 3 Quality Gate
- ✅ All hubs polished consistently
- ✅ Hub colors correct in each hub
- ✅ Dark mode works in all hubs
- ✅ Visual verification complete
- ✅ Zero lint errors
- ✅ Zero type errors

### Phase 4 Quality Gate
- ✅ Login page professional and polished
- ✅ Landing page works for unauthenticated users
- ✅ Redirect works for authenticated users
- ✅ Mobile responsive
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Dark mode works
- ✅ Zero lint errors
- ✅ Zero type errors

### Phase 5 Quality Gate
- ✅ All enhancements polished
- ✅ Visual regression tests pass
- ✅ Performance targets met (60fps, CLS < 0.1)
- ✅ Accessibility audit passes (WCAG 2.1 AA)
- ✅ All tests pass
- ✅ Zero lint errors
- ✅ Zero type errors

### Phase 6 Quality Gate
- ✅ All browsers tested
- ✅ All devices tested
- ✅ Critical issues resolved
- ✅ Documentation complete
- ✅ Zero lint errors
- ✅ Zero type errors

### Apollo's QA Gate (After Each Story)
- ✅ Story acceptance criteria met
- ✅ Visual verification (if applicable)
- ✅ Dark mode verified (if applicable)
- ✅ Accessibility verified (if applicable)
- ✅ Performance verified (if applicable)
- ✅ Zero lint errors
- ✅ Zero type errors

**Divine Law:** No story may proceed to next phase until Apollo's QA gate passes!

---

## Risk Assessment

### Technical Risks

**Risk 1: Animation Performance on Low-End Devices**
- **Impact:** High
- **Probability:** Medium
- **Mitigation:** 
  - Use only `transform` and `opacity` (GPU-accelerated)
  - Respect `prefers-reduced-motion`
  - Test on mid-range devices early (Story 5.5)
  - Provide fallback (no animations on very slow devices)

**Risk 2: Dark Mode Regression**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:**
  - Test every component in dark mode immediately (each story)
  - Use design tokens (no hardcoded colors)
  - Automated visual regression tests (Story 5.4)
  - Design system tokens prevent issues

**Risk 3: Hub Color Inconsistency**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:**
  - Centralized `HUB_COLORS` constant (Story 2.1)
  - TypeScript types for hub names
  - Visual testing of each hub (Epic 3.0)
  - Code review for hardcoded colors

**Risk 4: Accessibility Degradation**
- **Impact:** High
- **Probability:** Low
- **Mitigation:**
  - Follow WCAG 2.1 AA guidelines (all stories)
  - Automated accessibility testing (Story 5.6)
  - Manual keyboard navigation testing
  - Screen reader testing

**Risk 5: Employee Hub Dependency**
- **Impact:** Low
- **Probability:** Low
- **Mitigation:**
  - Story 3.4 can be skipped if Employee Hub not created
  - Can complete when Employee Hub is ready
  - No blocking dependency

---

## Success Metrics

### Quantitative
- Animation FPS: 60fps on target devices (Story 5.5)
- CLS (Cumulative Layout Shift): < 0.1 (Story 5.5)
- WCAG 2.1 AA compliance: 100% (Story 5.6)
- Mobile page load: < 2s (Story 5.5)
- Zero lint errors (all stories)
- Zero type errors (all stories)
- Unit test coverage: 90%+ (where applicable)

### Qualitative
- User feedback: "App feels professional and polished"
- Visual comparison: "No longer looks like generic AI app"
- Consistent feedback: "Hub colors clear and consistent"
- Accessibility: "Keyboard navigation smooth"
- Dark mode: "Equally polished as light mode"

---

## Summary

**Total Stories:** 24  
**Total Phases:** 6  
**Total Estimated Time:** 12-14 days (sequential) or 10-12 days (with parallelization)

**Epic Breakdown:**
- Epic 1.0: Foundation (2 days) - 3 stories
- Epic 2.0: Core Components (3 days) - 7 stories
- Epic 3.0: Hub Layouts (3 days) - 6 stories (can parallelize)
- Epic 4.0: Login & Landing (1.5 days) - 2 stories
- Epic 5.0: Polish & Testing (2 days) - 6 stories
- Epic 6.0: Browser Testing (1 day) - 2 stories

**Quality Gates:** Strict enforcement at each phase and story level

**Ready for:** Prometheus Epic Planning and Hephaestus Implementation

---

**TDD Status:** ✅ **COMPLETE AND VALIDATED**

📜 **Hermes's Note:** This TDD plan breaks the PRD into implementable stories with clear acceptance criteria. Dependencies are mapped, parallelization opportunities identified, and quality gates defined. Ready for Prometheus to validate epic structure and file-touch conflicts.

**Next Command:** Prometheus to validate epic structure and plan parallelization strategy.

