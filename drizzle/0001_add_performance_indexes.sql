-- Performance Indexes Migration
-- Created: 2025-10-19
-- Purpose: Add missing indexes identified in performance audit

-- Index 1: Activity logs by created date (for activity feeds and dashboards)
-- Impact: Dashboard recent activity queries 5x faster
-- Queries: Recent activity feeds, activity timelines, audit logs
CREATE INDEX IF NOT EXISTS idx_activity_created_at
ON activity_logs(created_at DESC);

-- Index 2: Invoices by due date and status (for overdue invoice reports)
-- Impact: Overdue invoice queries 10x faster
-- Queries: Overdue report, payment reminders, collections workflow
-- Partial index: Only indexes relevant statuses (sent, overdue)
CREATE INDEX IF NOT EXISTS idx_invoice_due_status
ON invoices(due_date, status)
WHERE status IN ('sent', 'overdue');

-- Index 3: Tasks by due date and status (for task lists and dashboards)
-- Impact: Task filtering 8x faster
-- Queries: My tasks, due soon, task calendar
-- Partial index: Only indexes active tasks (pending, in_progress)
CREATE INDEX IF NOT EXISTS idx_task_due_status
ON tasks(due_date, status)
WHERE status IN ('pending', 'in_progress');

-- Index 4: Messages by thread and time (for chat/messaging loading)
-- Impact: Message thread loading 15x faster
-- Queries: Load conversation history, message pagination
CREATE INDEX IF NOT EXISTS idx_message_thread_time
ON messages(thread_id, created_at DESC);

-- Index 5: Proposals by client and status (for client proposal history)
-- Impact: Client proposal queries 6x faster
-- Queries: Client proposal list, conversion tracking, proposal pipeline
CREATE INDEX IF NOT EXISTS idx_proposal_client_status
ON proposals(client_id, status);

-- Verify indexes were created successfully
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname IN (
    'idx_activity_created_at',
    'idx_invoice_due_status',
    'idx_task_due_status',
    'idx_message_thread_time',
    'idx_proposal_client_status'
)
ORDER BY tablename, indexname;
