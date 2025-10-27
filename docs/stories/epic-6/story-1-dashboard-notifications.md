# User Story: Dashboard Deadlines & Notification Preferences

**Story ID:** STORY-6.1
**Epic:** Epic 6 - Polish & Enhancements
**Feature:** FR30 (Dashboard Upcoming Deadlines) + FR31 (Notification Preferences)
**Priority:** Low
**Effort:** 2 days
**Status:** ✅ Validated (100/100) - Ready for Development

---

## User Story

**As a** staff member
**I want** dashboard deadlines widget showing real data and notification preferences that persist
**So that** I see upcoming deadlines at a glance and control notification delivery

---

## Business Value

- **Visibility:** Real-time deadline visibility on dashboard
- **Control:** User control over notification preferences
- **Polish:** Replaces hardcoded placeholders with real data

**Epic Context:**

This story is part of Epic 6 - Polish & Enhancements (Tier 6: FR30-FR34, 3-5 days total):
- **Story 6.1 (this story):** Dashboard deadlines + notification preferences (2 days)
- **Story 6.2:** Email automation + API documentation (docs/stories/epic-6/story-2-email-api-docs.md, 4-5 days)
- **Story 6.3:** Weekly timesheet restoration (docs/stories/epic-6/story-3-weekly-timesheet-restoration.md, 2-3 days)

All stories in Epic 6 aim to achieve 100% feature parity with archived CRM and complete final polish items for production readiness.

---

## Domain Glossary

**Compliance:** Regulatory obligations, tax deadlines, and statutory filing requirements (e.g., Corporation Tax, VAT Return, Annual Accounts). The compliance table tracks these deadlines with due dates, assigned staff, and completion status.

**Compliance Detail:** Detail page at `/client-hub/compliance/${id}` showing full compliance item information (client, type, description, assignee, documents, history).

**Digest Email:** Scheduled summary email (daily or weekly) consolidating multiple notifications into a single message instead of sending individual notification emails.

**Hardcoded Placeholder:** Current dashboard widget shows static example "Corporation Tax - XYZ" instead of real data from the compliance table.

**Notification Types:** Granular categories of notifications (task_assigned, task_mention, deadline_approaching, etc.) that users can individually enable/disable.

---

## Acceptance Criteria

**Dashboard Upcoming Deadlines (FR30):**
**AC1:** Query compliance table for deadlines (due_date within 30 days)
**AC2:** Display in dashboard widget, replace hardcoded placeholder
**AC3:** Widget shows: type, client name, due date, urgency indicator
**AC4:** Click navigates to compliance detail
**AC5:** Deadline count badge: "5 upcoming deadlines"
**AC6:** Color-coded urgency: red (<7 days), yellow (7-14 days), green (14-30 days)
**AC7:** Empty state: "No upcoming deadlines"
**AC8:** tRPC: compliance.getUpcoming({ days: 30 })

**Notification Preferences (FR31):**
**AC9:** Extend userSettings table with notification type preferences:
  - notif_task_assigned (boolean, default true)
  - notif_task_mention (boolean, default true)
  - notif_task_reassigned (boolean, default true)
  - notif_deadline_approaching (boolean, default true)
  - notif_approval_needed (boolean, default true)
  - notif_client_message (boolean, default true)
  Note: emailNotifications, inAppNotifications, digestEmail already exist in userSettings
**AC10:** Wire notification preferences UI to backend
**AC11:** Implement settings.updateNotificationSettings mutation
**AC12:** Save preferences to userSettings table
**AC13:** Preference enforcement: check user preferences before sending notification
  - Check emailNotifications AND specific type (e.g., notifTaskAssigned)
  - Check inAppNotifications AND specific type
  - Example: if (!prefs.emailNotifications || !prefs.notifTaskAssigned) skip email
**AC14:** Default preferences: all enabled on first login
**AC15:** Preference preview: "You will receive [X] types via [email/in-app]"

---

## Technical Implementation

```typescript
// Query upcoming deadlines from compliance table
const upcomingDeadlines = await db
  .select()
  .from(compliance)
  .where(
    and(
      eq(compliance.tenantId, ctx.authContext.tenantId),
      gte(compliance.dueDate, new Date()),
      lte(compliance.dueDate, addDays(new Date(), 30))
    )
  )
  .orderBy(asc(compliance.dueDate));

// Check notification preferences before sending
const prefs = await getNotificationPreferences(userId);
if (prefs.emailNotifications && prefs.notifTaskAssigned) {
  await sendEmail(...);
}
```

---

## Technical Details

### Files to Modify

**Dashboard Upcoming Deadlines (FR30):**
1. `app/server/routers/compliance.ts` - Add `getUpcoming` procedure
2. `app/client-hub/dashboard/page.tsx` - Wire widget to tRPC query, replace hardcoded placeholder
3. `lib/db/schema.ts` - Verify compliance table schema (no changes needed, table exists)

**Notification Preferences (FR31):**
1. `lib/db/schema.ts` - Extend userSettings table with 6 notification preference boolean columns (see AC9)
2. `app/server/routers/settings.ts` - Add/update `updateNotificationSettings` mutation
3. `app/client-hub/settings/page.tsx` - Wire notification preferences UI to backend
4. `app/server/routers/tasks.ts` - Update notification creation logic to check preferences (lines with `notifications.create`)
5. `app/server/routers/task-generation.ts` - Update notification creation to check preferences
6. `scripts/seed.ts` - Update seed data to include default notification preferences for test users

### Technology Stack

**Frontend:**
- React 19 with Next.js 15 App Router
- shadcn/ui components (use existing Switch, Label, Card components)
- React Hook Form for notification preferences form
- Zod for form validation
- tRPC React Query hooks (`trpc.compliance.getUpcoming.useQuery`, `trpc.settings.updateNotificationSettings.useMutation`)
- react-hot-toast for success/error messages

**Backend:**
- tRPC with Drizzle ORM
- PostgreSQL with multi-tenant isolation (all queries filter by `ctx.authContext.tenantId`)
- Better Auth for session context

### Implementation Approach

**Dashboard Deadlines Widget:**
- Use `trpc.compliance.getUpcoming.useQuery({ days: 30 })` in dashboard component
- Map results to widget UI with urgency color logic (red/yellow/green based on days)
- Handle loading state with skeleton loader
- Handle empty state with "No upcoming deadlines" message
- Click handler navigates to `/client-hub/compliance/${item.id}`

**Notification Preferences Form:**
- React Hook Form with Zod schema validation
- 6 Switch components (one per notification type from AC9)
- 3 main toggles: Email Notifications, In-App Notifications, Digest Email (already exist as fields)
- Save button triggers `updateNotificationSettings` mutation
- Toast success message: "Notification preferences saved"
- Toast error message: "Failed to save preferences"

**Preference Enforcement:**
- Create helper function: `lib/notifications/check-preferences.ts`
- Export `shouldSendNotification(userId: string, notificationType: string, channel: 'email' | 'in_app')`
- Call before every notification creation in tasks/task-generation routers
- Example: `if (await shouldSendNotification(userId, 'task_assigned', 'email')) { await sendEmail(...) }`

### Database Schema Changes

**Add to userSettings table (lib/db/schema.ts:166-183):**
```typescript
notifTaskAssigned: boolean("notif_task_assigned").default(true),
notifTaskMention: boolean("notif_task_mention").default(true),
notifTaskReassigned: boolean("notif_task_reassigned").default(true),
notifDeadlineApproaching: boolean("notif_deadline_approaching").default(true),
notifApprovalNeeded: boolean("notif_approval_needed").default(true),
notifClientMessage: boolean("notif_client_message").default(true),
```

**No changes needed to compliance table** (already exists with required fields)

### Edge Cases and Error Handling

**Dashboard Deadlines:**
- **Empty compliance table:** Display empty state "No upcoming deadlines" (AC7)
- **Large result sets (>50 deadlines):** Query returns all matches but consider adding limit (e.g., top 10 most urgent) if performance degrades
- **Null due_date values:** Query filters these out with `gte(compliance.dueDate, new Date())` - null dates won't match
- **Past deadlines (overdue):** Not shown in widget (only future deadlines within 30 days). Overdue items tracked separately via compliance status field.
- **No client assigned:** Widget shows compliance type and "Unassigned" for client name
- **Loading state:** Show skeleton loader while query is in flight (mentioned in Implementation Approach)
- **Query error:** Show error toast "Failed to load deadlines" and retry button

**Notification Preferences:**
- **Missing userSettings record (first-time user):** Create record with all preferences set to true (default enabled) on first settings page visit or first notification trigger
- **Partial save failure:** If mutation fails, show error toast and do not update UI state - user retries entire save
- **Concurrent updates:** Last write wins (acceptable for user preferences). Consider optimistic locking if conflicts become an issue.
- **Preference enforcement gaps:** If notification code doesn't check preferences, notification is sent anyway. Fix by updating all notification creation points (tasks.ts, task-generation.ts identified in Files to Modify).
- **Invalid preference values:** Zod schema validation rejects non-boolean values at API boundary
- **Digest email edge case:** If digestEmail = "never" but emailNotifications = true, send individual emails (digest setting is independent toggle)

**Multi-Tenant Isolation:**
- **Cross-tenant access:** All queries filtered by `ctx.authContext.tenantId` - no cross-tenant data leakage possible
- **Missing tenantId:** Auth context middleware ensures tenantId always present in protected procedures

---

## Testing

### Testing Approach

**Unit Tests (Vitest):**
- tRPC router procedures: `compliance.getUpcoming`, `settings.updateNotificationSettings`
- Helper functions: `shouldSendNotification` preference enforcement logic
- Utility functions: Urgency color calculation, date range filtering

**Integration Tests (Vitest):**
- End-to-end tRPC procedure calls with database interactions
- Multi-tenant isolation verification
- Notification preference enforcement in tasks/task-generation routers

**Component Tests (Vitest + React Testing Library):**
- Dashboard deadlines widget rendering
- Notification preferences form interaction
- Loading/error/empty states

**E2E Tests (Playwright - Optional):**
- Full user flow: View dashboard → See deadlines → Click deadline → Navigate to detail
- Full user flow: Open settings → Change preferences → Save → Verify enforcement

### Test Files

**Router Tests:**
- `__tests__/routers/compliance.test.ts` - Test `getUpcoming` procedure
- `__tests__/routers/settings.test.ts` - Test `updateNotificationSettings` mutation
- `__tests__/routers/tasks.test.ts` - Update existing tests to verify preference enforcement

**Helper/Utility Tests:**
- `__tests__/lib/notifications/check-preferences.test.ts` - Test `shouldSendNotification` logic

**Component Tests (Optional but Recommended):**
- `__tests__/components/dashboard-deadlines-widget.test.tsx`
- `__tests__/components/notification-preferences-form.test.tsx`

### Key Test Scenarios

**Dashboard Upcoming Deadlines (`compliance.getUpcoming`):**

1. ✅ **Happy path:** Returns compliance items due within 30 days, sorted by due_date ascending
2. ✅ **Empty state:** Returns empty array when no upcoming deadlines exist
3. ✅ **Date filtering:** Only returns items with due_date between now and 30 days from now
4. ✅ **Past deadlines excluded:** Does not return items with due_date in the past
5. ✅ **Far future deadlines excluded:** Does not return items with due_date > 30 days from now
6. ✅ **Multi-tenant isolation:** User from Tenant A cannot see deadlines from Tenant B
7. ✅ **Null due_date handling:** Items with null due_date are excluded from results
8. ✅ **Sorting:** Results ordered by due_date ascending (earliest deadline first)
9. ✅ **Urgency calculation:** Correctly calculates urgency level (red <7 days, yellow 7-14 days, green 14-30 days)
10. ✅ **Client name resolution:** Includes client name in results (or "Unassigned" if null)

**Notification Preferences (`settings.updateNotificationSettings`):**

11. ✅ **Happy path:** Saves all 6 notification type preferences to userSettings table
12. ✅ **Create if missing:** Creates userSettings record if user doesn't have one (first-time user)
13. ✅ **Update existing:** Updates existing userSettings record if user already has preferences
14. ✅ **Default values:** New records default all preferences to true (AC14)
15. ✅ **Multi-tenant isolation:** User from Tenant A cannot update preferences for user in Tenant B
16. ✅ **Validation:** Rejects non-boolean values for preference fields (Zod schema validation)
17. ✅ **Partial updates:** Can update subset of preferences (e.g., only notifTaskAssigned)

**Preference Enforcement (`shouldSendNotification`):**

18. ✅ **Global email disabled:** Does not send email if emailNotifications = false (regardless of specific type)
19. ✅ **Specific type disabled:** Does not send email if emailNotifications = true but notifTaskAssigned = false
20. ✅ **Both enabled:** Sends email if emailNotifications = true AND notifTaskAssigned = true
21. ✅ **In-app notifications:** Same logic for inAppNotifications AND specific type
22. ✅ **Missing userSettings:** Defaults to enabled (send notification) if user has no preferences record
23. ✅ **Digest email handling:** Respects digestEmail setting (daily/weekly/never)

### Success Criteria

**Test Coverage:**
- ✅ Minimum 80% line coverage for new code (router procedures, helper functions)
- ✅ 100% coverage of critical paths (preference enforcement, multi-tenant isolation)
- ✅ All 23 test scenarios passing

**Test Execution:**
- ✅ All unit tests pass: `pnpm test __tests__/routers/compliance.test.ts __tests__/routers/settings.test.ts`
- ✅ All integration tests pass
- ✅ No test flakiness (tests pass consistently 5/5 runs)

**Quality Gates:**
- ✅ Multi-tenant isolation verified (test scenarios 6, 15 passing)
- ✅ Edge cases covered (null values, missing records, large datasets)
- ✅ Error scenarios tested (validation errors, query failures)

### Special Testing Considerations

**Date/Time Mocking:**
- Use `vi.setSystemTime()` to freeze current date for consistent deadline filtering tests
- Test deadline urgency calculation with various frozen dates (6 days out, 10 days out, 25 days out)
- Reset time after each test with `vi.useRealTimers()`

**Multi-Tenant Test Data:**
- Create 2+ test tenants (Tenant A, Tenant B) in `beforeEach` setup
- Create compliance items for each tenant with different due dates
- Verify queries scoped to correct tenant
- Clean up test data in `afterEach` to prevent test pollution

**Notification Preference State:**
- Test both "missing userSettings" and "existing userSettings" scenarios
- Use dynamic slugs/emails with timestamps to avoid duplicate key errors (learned from Epic 4 Story 1)
- Create helper function `createTestUserWithPreferences(tenantId, preferences)` for consistent test data

**Database Seeding:**
- Update `scripts/seed.ts` with sample compliance deadlines (various due dates covering all urgency levels)
- Add default notification preferences for seed users
- Ensure seed data covers edge cases (null client, overdue deadlines, far future deadlines)

**Performance Testing (Optional):**
- Test `compliance.getUpcoming` with 100+ compliance items to verify query performance
- Consider adding `.limit(10)` if response time > 500ms

---

## Definition of Done

- [ ] Dashboard deadlines widget wired to compliance table
- [ ] Urgency color coding working
- [ ] Notification preferences UI wired
- [ ] Preferences saved to userSettings
- [ ] Preference enforcement implemented
- [ ] Multi-tenant isolation verified
- [ ] Tests written

---

## Dependencies

**Required Infrastructure:**
- ✅ compliance table (added via schema enhancement Sep 2025, commit 4566a1a7)
- ✅ userSettings table (created in Epic 2, Story 3 - docs/stories/epic-2/story-3-settings-persistence.md)
- ✅ Dashboard widget UI (existing, needs data wiring)
- ✅ Notification preferences UI (existing, needs backend persistence)

**Upstream Dependencies:**
- Epic 2, Story 3 (Settings Persistence - docs/stories/epic-2/story-3-settings-persistence.md) - userSettings table exists
- No other epic dependencies (compliance table added outside epic workflow)

**Downstream Dependencies:**
- None (Story 6.2 and 6.3 are independent)

**Schema Status:**
- userSettings table already has: emailNotifications, inAppNotifications, digestEmail
- Only missing: 6 boolean columns for notification type granularity (see AC9)
- compliance table is functional and multi-tenant isolated (has tenantId, router exists at app/server/routers/compliance.ts)

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-6 - Polish & Enhancements
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR30 + FR31)
