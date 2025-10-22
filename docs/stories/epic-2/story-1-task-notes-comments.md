# User Story: Task Notes & Comments System

**Story ID:** STORY-2.1
**Epic:** Epic 2 - High-Impact Workflows
**Feature:** FR5 - Task Notes & Comments System
**Priority:** High
**Effort:** 4-5 days
**Status:** Ready for Development

---

## User Story

**As a** staff member managing tasks
**I want** thread-based task commenting with @mentions and notifications
**So that** I can eliminate email/Slack fragmentation and centralize task discussions

---

## Business Value

- **Collaboration:** Centralizes task discussions, eliminating email/Slack fragmentation
- **Efficiency:** Reduces time searching for task-related conversations
- **Context:** Keeps all task communication in one place with full history
- **Notifications:** @mentions automatically notify relevant team members

---

## Acceptance Criteria

### Functional Requirements - Task Notes

**AC1: Create Task Note**
- **Given** a user is viewing a task detail page
- **When** they write a comment and click "Add Comment"
- **Then** the note is saved to the database
- **And** the note appears in the task notes timeline

**AC2: @Mention Parsing**
- **Given** a user types "@" in the comment field
- **When** they continue typing a username
- **Then** an autocomplete dropdown appears with matching tenant users
- **And** selecting a user inserts "@[User Name]" format
- **And** the mentioned user's ID is stored in `mentionedUsers[]` array

**AC3: @Mention Notifications**
- **Given** a task note is created with @mentions
- **When** the note is saved
- **Then** in-app notifications are created for all mentioned users
- **And** notification type is "task_mention"
- **And** notification links to the specific task

**AC4: Edit Task Note**
- **Given** a user is the note author or admin
- **When** they click "Edit" on their note
- **Then** the note becomes editable
- **And** saving updates the note and sets `updatedAt` timestamp
- **And** an "edited" indicator is shown

**AC5: Delete Task Note**
- **Given** a user is the note author or admin
- **When** they click "Delete" on a note
- **Then** the note is soft deleted (marked as deleted, not removed)
- **And** the note is hidden from the timeline

**AC6: Internal vs External Notes**
- **Given** a user is creating a task note
- **When** they toggle "Internal Note" checkbox
- **Then** the note is marked as internal (staff-only)
- **And** internal notes have a "Staff Only" badge
- **And** external notes are client-visible (Phase 2 client portal integration)

**AC7: Note Count Badge**
- **Given** tasks are displayed in a list
- **When** the task card is rendered
- **Then** a comment count badge is shown (e.g., "3 comments")
- **And** clicking the badge navigates to task detail page

**AC8: Timestamp Display**
- **Given** a task note is displayed
- **When** the user views the timeline
- **Then** relative timestamp is shown (e.g., "2 hours ago")
- **And** hovering shows absolute timestamp (e.g., "22 Oct 2025, 14:35")

### Integration Requirements

**AC9: Activity Feed Integration**
- **Given** task notes are created
- **When** the activity timeline is viewed
- **Then** notes appear in chronological order with other task events
- **And** note events show: author, timestamp, note preview

**AC10: Complete Skeleton UI**
- **Given** skeleton UI exists at task-details.tsx:874-918
- **When** the backend is implemented
- **Then** all skeleton components are functional
- **And** comments section shows real data from database

### Quality Requirements

**AC11: Performance**
- **Given** a task has 50+ notes
- **When** the task detail page loads
- **Then** notes load in <1 second
- **And** notes are paginated if >20 notes

**AC12: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** task notes are queried
- **Then** all queries filter by tenantId
- **And** @mention autocomplete only shows users from the same tenant

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// taskNotes table
export const taskNotes = pgTable("task_notes", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  taskId: text("task_id").references(() => tasks.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  isInternal: boolean("is_internal").default(false),
  mentionedUsers: text("mentioned_users").array(), // PostgreSQL text[] for user IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => ({
  // Index for query performance
  taskIdIdx: index("task_notes_task_id_idx").on(table.taskId),
  tenantIdIdx: index("task_notes_tenant_id_idx").on(table.tenantId),
}));
```

### File Structure

```
app/server/routers/
  tasks.ts                    # Extend with note procedures
components/client-hub/
  task-notes-section.tsx      # Task notes UI component
  mention-autocomplete.tsx    # @mention autocomplete dropdown
lib/services/
  mention-parser.ts           # Parse @mentions from text
```

### tRPC Procedures

```typescript
// app/server/routers/tasks.ts

// Add to existing tasksRouter
export const tasksRouter = router({
  // ... existing procedures

  // Create task note
  createNote: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      note: z.string().min(1).max(10000),
      isInternal: z.boolean().default(false),
      mentionedUsers: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const noteId = crypto.randomUUID();

      await db.insert(taskNotes).values({
        id: noteId,
        tenantId: ctx.authContext.tenantId,
        taskId: input.taskId,
        userId: ctx.authContext.userId,
        note: input.note,
        isInternal: input.isInternal,
        mentionedUsers: input.mentionedUsers,
      });

      // Create notifications for mentioned users
      for (const mentionedUserId of input.mentionedUsers) {
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          tenantId: ctx.authContext.tenantId,
          userId: mentionedUserId,
          type: "task_mention",
          title: "You were mentioned in a task",
          message: `${ctx.authContext.firstName} mentioned you in task comments`,
          link: `/client-hub/tasks/${input.taskId}`,
          read: false,
        });
      }

      return { success: true, noteId };
    }),

  // Get task notes
  getNotes: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const notes = await db
        .select({
          id: taskNotes.id,
          note: taskNotes.note,
          isInternal: taskNotes.isInternal,
          mentionedUsers: taskNotes.mentionedUsers,
          createdAt: taskNotes.createdAt,
          updatedAt: taskNotes.updatedAt,
          author: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(taskNotes)
        .innerJoin(users, eq(taskNotes.userId, users.id))
        .where(
          and(
            eq(taskNotes.tenantId, ctx.authContext.tenantId),
            eq(taskNotes.taskId, input.taskId),
            isNull(taskNotes.deletedAt) // Exclude soft-deleted notes
          )
        )
        .orderBy(desc(taskNotes.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return notes;
    }),

  // Update task note
  updateNote: protectedProcedure
    .input(z.object({
      noteId: z.string(),
      note: z.string().min(1).max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns note or is admin
      const existingNote = await db
        .select()
        .from(taskNotes)
        .where(
          and(
            eq(taskNotes.id, input.noteId),
            eq(taskNotes.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (existingNote.length === 0) {
        throw new Error("Note not found");
      }

      const isOwner = existingNote[0].userId === ctx.authContext.userId;
      const isAdmin = ctx.authContext.role === "admin" || ctx.authContext.role === "org:admin";

      if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized to edit this note");
      }

      await db
        .update(taskNotes)
        .set({
          note: input.note,
          updatedAt: new Date(),
        })
        .where(eq(taskNotes.id, input.noteId));

      return { success: true };
    }),

  // Delete task note (soft delete)
  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns note or is admin
      const existingNote = await db
        .select()
        .from(taskNotes)
        .where(
          and(
            eq(taskNotes.id, input.noteId),
            eq(taskNotes.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (existingNote.length === 0) {
        throw new Error("Note not found");
      }

      const isOwner = existingNote[0].userId === ctx.authContext.userId;
      const isAdmin = ctx.authContext.role === "admin" || ctx.authContext.role === "org:admin";

      if (!isOwner && !isAdmin) {
        throw new Error("Unauthorized to delete this note");
      }

      await db
        .update(taskNotes)
        .set({ deletedAt: new Date() })
        .where(eq(taskNotes.id, input.noteId));

      return { success: true };
    }),

  // Get note count for task
  getNoteCount: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select({ count: count() })
        .from(taskNotes)
        .where(
          and(
            eq(taskNotes.tenantId, ctx.authContext.tenantId),
            eq(taskNotes.taskId, input.taskId),
            isNull(taskNotes.deletedAt)
          )
        );

      return result[0]?.count || 0;
    }),

  // Get users for @mention autocomplete
  getMentionableUsers: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const users = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, ctx.authContext.tenantId),
            or(
              ilike(users.firstName, `%${input.query}%`),
              ilike(users.lastName, `%${input.query}%`),
              ilike(users.email, `%${input.query}%`)
            )
          )
        )
        .limit(10);

      return users;
    }),
});
```

### Mention Parser Service

```typescript
// lib/services/mention-parser.ts

export function parseMentions(text: string): string[] {
  // Parse @mentions in format @[User Name] or @username
  const mentionRegex = /@\[(.*?)\]|@(\w+)/g;
  const mentions: string[] = [];

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const mention = match[1] || match[2]; // Get captured group
    mentions.push(mention);
  }

  return mentions;
}

export function highlightMentions(text: string): string {
  // Replace @mentions with styled spans (for display)
  return text.replace(
    /@\[(.*?)\]/g,
    '<span class="text-primary font-semibold">@$1</span>'
  );
}
```

### UI Component Example

```typescript
// components/client-hub/task-notes-section.tsx
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { MentionAutocomplete } from "./mention-autocomplete";

export function TaskNotesSection({ taskId }: { taskId: string }) {
  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: notes, isLoading } = trpc.tasks.getNotes.useQuery({ taskId });
  const createNote = trpc.tasks.createNote.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      setNote("");
      setMentionedUsers([]);
      utils.tasks.getNotes.invalidate({ taskId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!note.trim()) return;

    createNote.mutate({
      taskId,
      note,
      isInternal,
      mentionedUsers,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Comment Input */}
      <div className="space-y-2">
        <MentionAutocomplete
          value={note}
          onChange={setNote}
          onMention={(userId) => setMentionedUsers([...mentionedUsers, userId])}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked === true)}
            />
            <label>Internal Note (Staff Only)</label>
          </div>

          <Button onClick={handleSubmit} disabled={createNote.isPending}>
            {createNote.isPending ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </div>

      {/* Notes Timeline */}
      {isLoading ? (
        <div>Loading comments...</div>
      ) : (
        <div className="space-y-3">
          {notes?.map((note) => (
            <div key={note.id} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {note.author.firstName} {note.author.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(note.createdAt)}
                  </span>
                  {note.updatedAt > note.createdAt && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                  {note.isInternal && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                      Staff Only
                    </span>
                  )}
                </div>
              </div>
              <div className="prose dark:prose-invert">
                <p dangerouslySetInnerHTML={{ __html: highlightMentions(note.note) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Technical Notes

- **@Mention Autocomplete:** Use Radix UI Popover component for dropdown
- **Mention Storage:** Store user IDs in PostgreSQL `text[]` array field
- **Notification Creation:** Automatically create in-app notification when user is mentioned
- **Performance:** Add index on `task_id` for fast note queries
- **Soft Delete:** Use `deletedAt` field instead of hard delete for audit trail

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] taskNotes table created with indexes
- [ ] tRPC mutations created: createNote, updateNote, deleteNote, getNotes, getNoteCount, getMentionableUsers
- [ ] @mention parsing functional (regex extracts @[User Name] format)
- [ ] @mention autocomplete dropdown functional with tenant user search
- [ ] Mentioned users receive in-app notifications
- [ ] Internal vs external note toggle functional
- [ ] Edit/delete note functional (owner or admin only)
- [ ] Soft delete implemented with deletedAt field
- [ ] Timestamp display (relative + absolute on hover)
- [ ] Edit history indicator ("edited" badge)
- [ ] Activity feed integration (notes appear in task timeline)
- [ ] Note count badge on task cards
- [ ] Complete skeleton UI at task-details.tsx:874-918
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Unit tests written for note CRUD operations
- [ ] Integration tests for @mention parsing and notifications
- [ ] E2E tests for task comment workflow
- [ ] Seed data updated with sample task notes
- [ ] Code reviewed with focus on security (XSS prevention in note display)
- [ ] Documentation updated: task commenting usage
- [ ] Performance benchmarks met (<1s note load for 50+ notes)
- [ ] No regressions in existing task functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- None (independent of other stories)

**Downstream:**
- Epic 3: Advanced Automation uses task notes for automated task generation notifications

**External:**
- None

---

## Testing Strategy

### Unit Tests
- Test note creation with and without @mentions
- Test @mention parsing (extract user IDs from text)
- Test note edit authorization (owner or admin only)
- Test soft delete (verify deletedAt set correctly)
- Test multi-tenant isolation (notes filtered by tenantId)

### Integration Tests
- Test note creation triggers notification for mentioned users
- Test note timeline ordering (newest first)
- Test note count badge accuracy
- Test autocomplete user search (tenant-scoped)

### E2E Tests
- Test full comment workflow: create, edit, delete
- Test @mention autocomplete dropdown interaction
- Test notification creation from @mention
- Test internal note visibility (staff-only badge)

---

## Risks & Mitigation

**Risk:** XSS vulnerability from user-generated note content
**Mitigation:** Sanitize note content before display; use React's dangerouslySetInnerHTML carefully; implement content security policy
**Impact:** Medium - could expose users to malicious scripts

**Risk:** @mention parsing complexity with edge cases
**Mitigation:** Use well-tested regex; extensive testing with various mention formats; fallback to plain text if parsing fails
**Impact:** Low - worst case is mentions not highlighted

**Risk:** Notification spam from excessive @mentions
**Mitigation:** Limit mentions per note (max 10); debounce autocomplete; user preference for mention notifications
**Impact:** Low - user can disable notifications in settings

---

## Notes

- Task notes UI skeleton already exists at task-details.tsx:874-918 - this story completes it
- @mention format follows Slack pattern: @[User Name] for display, user ID for storage
- Internal notes foundation for Phase 2 client portal (external notes visible to clients)
- Consider adding rich text editor (Tiptap or Lexical) in Phase 2 for formatting
- Notification system already exists - just need to create "task_mention" type
- Activity timeline integration pattern exists in task detail page - extend for notes

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-2 - High-Impact Workflows
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR5)
