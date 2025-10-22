# User Story: Dashboard Deadlines & Notification Preferences

**Story ID:** STORY-6.1
**Epic:** Epic 6 - Polish & Enhancements
**Feature:** FR30 (Dashboard Upcoming Deadlines) + FR31 (Notification Preferences)
**Priority:** Low
**Effort:** 2 days
**Status:** Ready for Development

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

---

## Acceptance Criteria

**Dashboard Upcoming Deadlines (FR30):**
**AC1:** Query complianceItems table for deadlines (due_date within 30 days)
**AC2:** Display in dashboard widget, replace hardcoded placeholder
**AC3:** Widget shows: type, client name, due date, urgency indicator
**AC4:** Click navigates to compliance detail
**AC5:** Deadline count badge: "5 upcoming deadlines"
**AC6:** Color-coded urgency: red (<7 days), yellow (7-14 days), green (14-30 days)
**AC7:** Empty state: "No upcoming deadlines"
**AC8:** tRPC: compliance.getUpcoming({ days: 30 })

**Notification Preferences (FR31):**
**AC9:** Extend userSettings table if needed (email_notifications, in_app_notifications, digest_email, notification_types JSONB)
**AC10:** Wire notification preferences UI to backend
**AC11:** Implement settings.updateNotificationSettings mutation
**AC12:** Save preferences to userSettings table
**AC13:** Preference enforcement: check before sending notification
**AC14:** Default preferences: all enabled on first login
**AC15:** Preference preview: "You will receive [X] types via [email/in-app]"

---

## Technical Implementation

```typescript
// Query upcoming deadlines
const upcomingDeadlines = await db
  .select()
  .from(complianceItems)
  .where(
    and(
      eq(complianceItems.tenantId, ctx.authContext.tenantId),
      gte(complianceItems.dueDate, new Date()),
      lte(complianceItems.dueDate, addDays(new Date(), 30))
    )
  )
  .orderBy(asc(complianceItems.dueDate));

// Check notification preferences before sending
const prefs = await getNotificationPreferences(userId);
if (prefs.emailNotifications && prefs.notificationTypes.task_assigned) {
  await sendEmail(...);
}
```

---

## Definition of Done

- [ ] Dashboard deadlines widget wired to complianceItems
- [ ] Urgency color coding working
- [ ] Notification preferences UI wired
- [ ] Preferences saved to userSettings
- [ ] Preference enforcement implemented
- [ ] Multi-tenant isolation verified
- [ ] Tests written

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-6 - Polish & Enhancements
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR30 + FR31)
