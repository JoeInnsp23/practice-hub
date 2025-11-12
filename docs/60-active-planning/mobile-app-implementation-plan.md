---
title: Mobile App Implementation Plan
description: Complete implementation plan for Practice Hub Employee and Client Portal mobile applications
tags: [planning, mobile, ios, android, implementation]
status: draft
created: 2025-11-12
---

# Mobile App Implementation Plan

## Overview

This document outlines the complete implementation plan for both Practice Hub mobile applications:
1. **Employee Hub Mobile** - Staff-facing app for accountancy firm operations
2. **Client Portal Mobile** - Client-facing app for document access and communication

## Current State

### ✅ What's Done (5% Complete)
- Monorepo structure with pnpm workspaces
- Shared packages infrastructure
- Basic Expo project scaffolding
- One example screen with mock data
- tRPC provider structure (not connected)
- Documentation

### ❌ What's Missing (95% Remaining)
Everything else.

## Phase 1: Foundation & Authentication (Week 1-2)

### 1.1 Core Dependencies & Setup
- [ ] Install React Navigation v7
- [ ] Install expo-secure-store for token storage
- [ ] Install expo-font for custom fonts
- [ ] Install expo-image for optimized images
- [ ] Install expo-constants for environment config
- [ ] Install react-native-safe-area-context
- [ ] Install @react-native-community/netinfo for connectivity
- [ ] Set up Sentry for error tracking
- [ ] Configure app.json with proper bundle IDs and permissions

### 1.2 Navigation Structure
- [ ] Set up React Navigation stack
- [ ] Create AuthStack (sign-in, sign-up, forgot password)
- [ ] Create MainStack (tab navigation)
- [ ] Create navigation types (TypeScript)
- [ ] Implement deep linking configuration
- [ ] Add navigation service for programmatic navigation

### 1.3 Authentication - Employee Hub
- [ ] Sign In screen
  - Email/password form with validation
  - Error handling and toast messages
  - Loading states
  - "Remember me" option
- [ ] Sign Up screen (if needed - or staff added by admin only?)
- [ ] Forgot Password screen
  - Email input
  - Reset link confirmation
- [ ] Better Auth integration
  - Session management
  - Token storage in SecureStore
  - Auto-refresh tokens
  - Session persistence across app restarts
- [ ] Biometric authentication (Face ID / Touch ID)
  - expo-local-authentication integration
  - Fallback to password

### 1.4 Authentication - Client Portal
- [ ] Client sign-in flow (simplified)
- [ ] First-time setup wizard (if needed)
- [ ] Same Better Auth + SecureStore integration

### 1.5 Shared Components Library
- [ ] Button component (primary, secondary, outline, ghost)
- [ ] Input component (text, password, email, phone)
- [ ] Card component (matching design system)
- [ ] LoadingSpinner component
- [ ] ErrorMessage component
- [ ] EmptyState component
- [ ] Avatar component
- [ ] Badge component
- [ ] Divider component

## Phase 2: Employee Hub - Core Features (Week 3-5)

### 2.1 Dashboard/Home Screen
- [ ] Header with tenant name, user avatar
- [ ] Quick stats cards (clients, proposals, tasks)
- [ ] Recent activity feed
- [ ] Quick actions (add client, create proposal)
- [ ] Search bar
- [ ] Pull-to-refresh

### 2.2 Clients Module
- [ ] Clients List Screen
  - Search and filter
  - Sort options (name, date, status)
  - Infinite scroll / pagination
  - Swipe actions (call, email, archive)
- [ ] Client Detail Screen
  - Client information card
  - Contact details (tap to call/email)
  - Recent proposals
  - Documents list
  - Notes section
  - Activity timeline
- [ ] Add/Edit Client Screen
  - Form with validation (React Hook Form + Zod)
  - All client fields from database schema
  - Image picker for logo/avatar
  - Auto-save drafts
- [ ] Client Search with filters
- [ ] tRPC integration
  - clients.list query
  - clients.getById query
  - clients.create mutation
  - clients.update mutation
  - clients.delete mutation

### 2.3 Proposals Module
- [ ] Proposals List Screen
  - Filter by status (draft, sent, accepted, rejected)
  - Sort by date, value, client
  - Status badges
- [ ] Proposal Detail Screen
  - Proposal overview
  - Services breakdown
  - Pricing calculator results
  - Timeline
  - Status actions (send, withdraw, archive)
- [ ] Create Proposal Flow
  - Client selection
  - Services selection (multi-select with search)
  - Pricing calculator integration
  - Terms and conditions
  - Preview before send
- [ ] Edit Proposal Screen
- [ ] tRPC integration
  - proposals.list query
  - proposals.getById query
  - proposals.create mutation
  - proposals.update mutation
  - proposals.send mutation
  - proposals.delete mutation

### 2.4 Documents Module
- [ ] Documents List Screen
  - Filter by type, client, date
  - Download progress indicators
- [ ] Document Viewer
  - PDF viewer (expo-document-picker / react-native-pdf)
  - Image viewer with zoom
  - Share functionality
- [ ] Upload Document Flow
  - Camera integration (expo-camera)
  - Gallery picker (expo-image-picker)
  - File picker (expo-document-picker)
  - Upload progress
  - OCR integration (optional - Google ML Kit)
- [ ] S3 integration
  - Presigned URLs for uploads
  - Download with caching
  - Offline access to downloaded files

### 2.5 Profile & Settings
- [ ] Profile Screen
  - User info display
  - Avatar upload
  - Edit profile form
- [ ] Settings Screen
  - Notifications toggle
  - Biometric settings
  - Theme selection (light/dark)
  - Language selection
  - App version info
  - Sign out
- [ ] Notifications Settings
  - Push notification preferences
  - Email notification preferences

## Phase 3: Client Portal Mobile (Week 6-7)

### 3.1 Client Dashboard
- [ ] Welcome message with client name
- [ ] Quick stats (documents, proposals, invoices)
- [ ] Recent documents
- [ ] Pending actions (proposals to review, documents to sign)
- [ ] Messages from accountant

### 3.2 Documents Access
- [ ] Documents List
  - Categorized by type
  - Search functionality
  - Download for offline access
- [ ] Document Viewer (same as Employee Hub)
- [ ] Document signing flow
  - DocuSeal integration
  - E-signature capture
  - Status tracking

### 3.3 Proposals Review
- [ ] View proposals sent by accountant
- [ ] Accept/Reject actions
- [ ] Signature capture for acceptance
- [ ] Comments/feedback form

### 3.4 Invoices & Payments
- [ ] Invoices list
- [ ] Invoice detail view
- [ ] Payment status
- [ ] Payment history
- [ ] (Optional) Payment gateway integration

### 3.5 Messaging
- [ ] Inbox screen
- [ ] Message thread view
- [ ] Send message to accountant
- [ ] File attachments
- [ ] Push notifications for new messages

### 3.6 Client Profile
- [ ] View contact information
- [ ] Update contact details
- [ ] Change password
- [ ] Settings

## Phase 4: Real-time & Advanced Features (Week 8-9)

### 4.1 Push Notifications
- [ ] Expo Notifications setup
- [ ] Token registration and storage
- [ ] Backend integration (server-side)
- [ ] Notification handlers
  - Foreground notifications
  - Background notifications
  - Notification actions
- [ ] Notification types:
  - New message
  - Proposal status change
  - Document uploaded
  - Invoice due
  - Reminders

### 4.2 Offline Support
- [ ] React Query persistence
- [ ] SQLite local database (expo-sqlite)
- [ ] Offline queue for mutations
- [ ] Sync strategy (background sync)
- [ ] Conflict resolution
- [ ] Offline indicator in UI

### 4.3 Search & Filters
- [ ] Global search across all modules
- [ ] Advanced filters UI
- [ ] Recent searches
- [ ] Search suggestions

### 4.4 Forms & Validation
- [ ] Complete all forms with React Hook Form
- [ ] Zod schema validation (shared with web)
- [ ] Field-level error messages
- [ ] Form auto-save (drafts)
- [ ] Form submission states

## Phase 5: Polish & Optimization (Week 10-11)

### 5.1 UI/UX Polish
- [ ] Loading skeletons for all screens
- [ ] Empty states for all lists
- [ ] Error boundaries
- [ ] Optimistic updates
- [ ] Smooth animations (React Native Reanimated)
- [ ] Haptic feedback (expo-haptics)
- [ ] Pull-to-refresh everywhere
- [ ] Swipe gestures

### 5.2 Performance Optimization
- [ ] Image optimization and caching
- [ ] List virtualization (FlashList)
- [ ] Code splitting
- [ ] Bundle size optimization
- [ ] Memory leak detection
- [ ] Performance monitoring (Sentry)

### 5.3 Accessibility
- [ ] Screen reader support
- [ ] Proper labeling (accessibilityLabel)
- [ ] Focus management
- [ ] Color contrast compliance
- [ ] Font scaling support
- [ ] Keyboard navigation

### 5.4 Design System Implementation
- [ ] Match Practice Hub web design system
- [ ] Color tokens (light/dark themes)
- [ ] Typography system
- [ ] Spacing/sizing constants
- [ ] Glass-card mobile equivalent
- [ ] Consistent animations

## Phase 6: Testing (Week 12)

### 6.1 Unit Tests
- [ ] Shared types validation
- [ ] Utility functions
- [ ] Custom hooks
- [ ] Form validation logic

### 6.2 Integration Tests
- [ ] tRPC client integration
- [ ] Authentication flow
- [ ] Navigation flows
- [ ] Form submissions

### 6.3 E2E Tests
- [ ] Detox setup
- [ ] Critical user flows:
  - Sign in → View clients → View client detail
  - Create proposal → Send proposal
  - Upload document
  - Sign out
- [ ] Employee Hub critical paths
- [ ] Client Portal critical paths

### 6.4 Manual Testing
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Test on different screen sizes
- [ ] Test with slow network
- [ ] Test offline scenarios
- [ ] Test push notifications
- [ ] Test biometric auth

## Phase 7: App Store Preparation (Week 13-14)

### 7.1 Assets & Branding
- [ ] App icon (1024x1024)
- [ ] Launch screen / Splash screen
- [ ] App screenshots (all required sizes)
  - iPhone 6.9" (iPhone 16 Pro Max)
  - iPhone 6.7" (iPhone 15 Plus)
  - iPhone 6.5" (iPhone 11 Pro Max)
  - iPad Pro 12.9"
- [ ] Android screenshots
- [ ] App preview videos (optional but recommended)
- [ ] Promo graphics

### 7.2 App Store Listings
**Employee Hub:**
- [ ] App name: "Practice Hub Employee"
- [ ] Subtitle
- [ ] Description (4000 chars max)
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Categories: Business, Productivity

**Client Portal:**
- [ ] App name: "Practice Hub Client"
- [ ] Subtitle
- [ ] Description
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Categories: Business, Finance

### 7.3 EAS Build Configuration
- [ ] eas.json configuration
- [ ] Development build profile
- [ ] Preview build profile
- [ ] Production build profile
- [ ] iOS certificates and provisioning profiles
- [ ] Android keystore setup
- [ ] Environment variables configuration
- [ ] Build version numbering strategy

### 7.4 App Store Connect Setup
- [ ] Create app records
- [ ] Configure app information
- [ ] Set up TestFlight for beta testing
- [ ] Add internal testers
- [ ] Beta test for 1-2 weeks
- [ ] Collect feedback and fix bugs

### 7.5 Compliance & Policies
- [ ] Privacy policy (mobile-specific additions)
- [ ] Terms of service
- [ ] Data handling disclosure
- [ ] Export compliance
- [ ] Content rating questionnaire
- [ ] Age rating

## Phase 8: Launch (Week 15)

### 8.1 Pre-Launch
- [ ] Final round of testing
- [ ] Performance audit
- [ ] Security audit
- [ ] Backup plan for rollback

### 8.2 iOS App Store Submission
- [ ] Submit for review
- [ ] Monitor review status
- [ ] Respond to any feedback
- [ ] Release to App Store

### 8.3 Google Play Submission
- [ ] Submit to internal testing
- [ ] Promote to closed testing
- [ ] Promote to production
- [ ] Release to Google Play

### 8.4 Post-Launch
- [ ] Monitor crash reports (Sentry)
- [ ] Monitor user reviews
- [ ] Set up analytics (Expo Analytics or Firebase)
- [ ] Create feedback collection mechanism
- [ ] Plan first update

## Phase 9: Post-Launch Iterations (Ongoing)

### 9.1 Analytics & Monitoring
- [ ] User engagement metrics
- [ ] Screen view tracking
- [ ] Feature usage analytics
- [ ] Crash analytics
- [ ] Performance metrics

### 9.2 User Feedback
- [ ] In-app feedback mechanism
- [ ] App store review monitoring
- [ ] Support ticket integration
- [ ] Feature request tracking

### 9.3 Continuous Improvements
- [ ] Regular bug fixes
- [ ] Performance optimizations
- [ ] New feature development
- [ ] OS updates compatibility

## Technical Debt to Address

### Shared tRPC Router
- [ ] Extract web app tRPC routers to shared package
- [ ] Export AppRouter type from shared package
- [ ] Update mobile apps to use real AppRouter
- [ ] Remove mock data from ClientsScreen

### Type Safety
- [ ] Complete type coverage for all API calls
- [ ] Strict TypeScript configuration
- [ ] Type-safe navigation params
- [ ] Type-safe environment variables

### Code Organization
- [ ] Feature-based folder structure
- [ ] Shared components library
- [ ] Shared hooks library
- [ ] Shared utilities library

## Estimated Timeline

**Total: 15 weeks (3.5 months) for MVP**

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 2 weeks | Auth working, navigation setup |
| Phase 2: Employee Hub Core | 3 weeks | Clients, proposals, documents functional |
| Phase 3: Client Portal | 2 weeks | All client-facing features |
| Phase 4: Advanced Features | 2 weeks | Push notifications, offline mode |
| Phase 5: Polish | 2 weeks | Production-ready UX |
| Phase 6: Testing | 1 week | Comprehensive test coverage |
| Phase 7: App Store Prep | 2 weeks | Ready for submission |
| Phase 8: Launch | 1 week | Live in stores |

**Post-launch: Ongoing maintenance and feature development**

## Resources Required

### Team
- 1-2 React Native developers (full-time)
- 1 Backend developer (supporting tRPC/API work)
- 1 UI/UX designer (part-time for mobile-specific designs)
- 1 QA tester (full-time weeks 10-15)

### Tools & Services
- Expo EAS Build subscription ($29-99/month)
- Apple Developer Program ($99/year)
- Google Play Developer ($25 one-time)
- Sentry (error tracking)
- Analytics service (Firebase or similar)
- Push notification service (Expo included)

## Success Metrics

### Technical
- [ ] < 2s app launch time
- [ ] < 0.1% crash rate
- [ ] > 95% test coverage for critical paths
- [ ] < 50MB app bundle size
- [ ] 4.5+ star average rating

### Business
- [ ] 50% staff adoption in first month
- [ ] 30% client adoption in first 3 months
- [ ] < 5% uninstall rate
- [ ] Positive NPS score

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| tRPC integration complexity | High | Start with simple queries, iterate |
| App Store rejection | High | Follow guidelines strictly, test thoroughly |
| Performance on older devices | Medium | Test on minimum supported devices |
| Push notification reliability | Medium | Fallback to email notifications |
| Offline sync conflicts | Medium | Clear conflict resolution strategy |
| Better Auth mobile compatibility | High | Test early, engage with Better Auth community |

## Next Steps

1. **Review and approve this plan**
2. **Prioritize features** - What's MVP vs. v1.1?
3. **Allocate resources** - Team assignments
4. **Set up project tracking** - Jira, Linear, or similar
5. **Begin Phase 1** - Foundation work

## Notes

- This is an aggressive but achievable timeline with a focused team
- Each phase can be deployed incrementally using TestFlight/Internal Testing
- Consider hiring an experienced React Native consultant for first 2-4 weeks to accelerate setup
- Budget approximately $50k-75k for 15 weeks of development (salary + tools)
