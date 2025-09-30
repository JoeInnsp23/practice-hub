-- Custom migration: Create database views for business logic consistency
-- This migration creates all necessary views for the CRM system

-- Client Details View (with account manager information)
CREATE VIEW "client_details_view" AS
SELECT
    c.*,
    u.first_name AS account_manager_first_name,
    u.last_name AS account_manager_last_name,
    CONCAT(u.first_name, ' ', u.last_name) AS account_manager_name,
    u.email AS account_manager_email
FROM clients c
LEFT JOIN users u ON c.account_manager_id = u.id;--> statement-breakpoint

-- Task Details View (with client and assignee names)
CREATE VIEW "task_details_view" AS
SELECT
    t.*,
    c.name AS client_name,
    c.client_code AS client_code,
    CONCAT(u1.first_name, ' ', u1.last_name) AS assignee_name,
    u1.email AS assignee_email,
    CONCAT(u2.first_name, ' ', u2.last_name) AS reviewer_name,
    u2.email AS reviewer_email,
    CONCAT(u3.first_name, ' ', u3.last_name) AS creator_name,
    w.name AS workflow_name,
    pt.title AS parent_task_title
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN users u1 ON t.assigned_to_id = u1.id
LEFT JOIN users u2 ON t.reviewer_id = u2.id
LEFT JOIN users u3 ON t.created_by_id = u3.id
LEFT JOIN workflows w ON t.workflow_id = w.id
LEFT JOIN tasks pt ON t.parent_task_id = pt.id;--> statement-breakpoint

-- Time Entries View (with user, client, task names)
CREATE VIEW "time_entries_view" AS
SELECT
    te.*,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.email AS user_email,
    c.name AS client_name,
    c.client_code AS client_code,
    t.title AS task_title,
    s.name AS service_name,
    s.code AS service_code,
    CONCAT(a.first_name, ' ', a.last_name) AS approver_name
FROM time_entries te
LEFT JOIN users u ON te.user_id = u.id
LEFT JOIN clients c ON te.client_id = c.id
LEFT JOIN tasks t ON te.task_id = t.id
LEFT JOIN services s ON te.service_id = s.id
LEFT JOIN users a ON te.approved_by_id = a.id;--> statement-breakpoint

-- Invoice Details View (with client information)
CREATE VIEW "invoice_details_view" AS
SELECT
    i.*,
    c.name AS client_name,
    c.client_code AS client_code,
    c.email AS client_email,
    c.vat_number AS client_vat_number,
    c.address_line1 AS client_address_line1,
    c.address_line2 AS client_address_line2,
    c.city AS client_city,
    c.postal_code AS client_postal_code,
    c.country AS client_country,
    CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
    (i.total - i.amount_paid) AS balance_due
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN users u ON i.created_by_id = u.id;--> statement-breakpoint

-- Invoice Items View (with service details)
CREATE VIEW "invoice_items_view" AS
SELECT
    ii.*,
    i.invoice_number,
    i.client_id,
    i.status AS invoice_status,
    s.name AS service_name,
    s.code AS service_code,
    s.category AS service_category
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LEFT JOIN services s ON ii.service_id = s.id;--> statement-breakpoint

-- Client Services View (with full service details)
CREATE VIEW "client_services_view" AS
SELECT
    cs.*,
    c.name AS client_name,
    c.client_code AS client_code,
    s.name AS service_name,
    s.code AS service_code,
    s.description AS service_description,
    s.category AS service_category,
    COALESCE(cs.custom_rate, s.default_rate) AS effective_rate
FROM client_services cs
LEFT JOIN clients c ON cs.client_id = c.id
LEFT JOIN services s ON cs.service_id = s.id;--> statement-breakpoint

-- Compliance Details View
CREATE VIEW "compliance_details_view" AS
SELECT
    comp.*,
    c.name AS client_name,
    c.client_code AS client_code,
    CONCAT(u1.first_name, ' ', u1.last_name) AS assignee_name,
    u1.email AS assignee_email,
    CONCAT(u2.first_name, ' ', u2.last_name) AS creator_name,
    CASE
        WHEN comp.due_date < CURRENT_DATE AND comp.status != 'completed' THEN true
        ELSE false
    END AS is_overdue
FROM compliance comp
LEFT JOIN clients c ON comp.client_id = c.id
LEFT JOIN users u1 ON comp.assigned_to_id = u1.id
LEFT JOIN users u2 ON comp.created_by_id = u2.id;--> statement-breakpoint

-- Activity Feed View (for dashboard)
CREATE VIEW "activity_feed_view" AS
SELECT
    al.*,
    CASE
        WHEN al.entity_type = 'client' THEN (SELECT name FROM clients WHERE id = al.entity_id)
        WHEN al.entity_type = 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
        WHEN al.entity_type = 'invoice' THEN (SELECT invoice_number FROM invoices WHERE id = al.entity_id)
        WHEN al.entity_type = 'compliance' THEN (SELECT title FROM compliance WHERE id = al.entity_id)
        ELSE NULL
    END AS entity_name,
    u.email AS user_email,
    CONCAT(u.first_name, ' ', u.last_name) AS user_display_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;--> statement-breakpoint

-- Task Workflow View (tasks with workflow progress)
CREATE VIEW "task_workflow_view" AS
SELECT
    t.id AS task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.progress AS task_progress,
    w.name AS workflow_name,
    w.type AS workflow_type,
    twi.status AS workflow_status,
    ws.name AS current_stage_name,
    ws.stage_order AS current_stage_order,
    twi.stage_progress,
    COUNT(DISTINCT ws2.id) AS total_stages
FROM tasks t
LEFT JOIN task_workflow_instances twi ON t.id = twi.task_id
LEFT JOIN workflows w ON twi.workflow_id = w.id
LEFT JOIN workflow_stages ws ON twi.current_stage_id = ws.id
LEFT JOIN workflow_stages ws2 ON ws2.workflow_id = w.id
WHERE t.workflow_id IS NOT NULL
GROUP BY t.id, t.title, t.status, t.progress, w.name, w.type,
         twi.status, ws.name, ws.stage_order, twi.stage_progress;--> statement-breakpoint

-- Dashboard KPI View (aggregated metrics)
CREATE VIEW "dashboard_kpi_view" AS
SELECT
    t.id AS tenant_id,
    -- Revenue metrics
    (SELECT COALESCE(SUM(total), 0) FROM invoices
     WHERE tenant_id = t.id AND status IN ('paid', 'sent')) AS total_revenue,
    (SELECT COALESCE(SUM(total), 0) FROM invoices
     WHERE tenant_id = t.id AND status = 'paid') AS collected_revenue,
    (SELECT COALESCE(SUM(total - amount_paid), 0) FROM invoices
     WHERE tenant_id = t.id AND status IN ('sent', 'overdue')) AS outstanding_revenue,

    -- Client metrics
    (SELECT COUNT(*) FROM clients
     WHERE tenant_id = t.id AND status = 'active') AS active_clients,
    (SELECT COUNT(*) FROM clients
     WHERE tenant_id = t.id AND created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_clients_30d,

    -- Task metrics
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'pending') AS pending_tasks,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'in_progress') AS in_progress_tasks,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'completed'
     AND completed_at >= CURRENT_DATE - INTERVAL '30 days') AS completed_tasks_30d,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND due_date < CURRENT_DATE
     AND status NOT IN ('completed', 'cancelled')) AS overdue_tasks,

    -- Time tracking metrics
    (SELECT COALESCE(SUM(hours), 0) FROM time_entries
     WHERE tenant_id = t.id AND date >= CURRENT_DATE - INTERVAL '30 days') AS total_hours_30d,
    (SELECT COALESCE(SUM(hours), 0) FROM time_entries
     WHERE tenant_id = t.id AND billable = true
     AND date >= CURRENT_DATE - INTERVAL '30 days') AS billable_hours_30d,

    -- Compliance metrics
    (SELECT COUNT(*) FROM compliance
     WHERE tenant_id = t.id AND status != 'completed'
     AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS upcoming_compliance_30d,
    (SELECT COUNT(*) FROM compliance
     WHERE tenant_id = t.id AND status != 'completed'
     AND due_date < CURRENT_DATE) AS overdue_compliance
FROM tenants t;--> statement-breakpoint

-- Monthly Revenue View (for charts)
CREATE VIEW "monthly_revenue_view" AS
SELECT
    tenant_id,
    DATE_TRUNC('month', issue_date) AS month,
    SUM(CASE WHEN status IN ('sent', 'paid', 'overdue') THEN total ELSE 0 END) AS invoiced,
    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) AS collected,
    COUNT(*) AS invoice_count,
    COUNT(DISTINCT client_id) AS unique_clients
FROM invoices
GROUP BY tenant_id, DATE_TRUNC('month', issue_date)
ORDER BY tenant_id, month DESC;--> statement-breakpoint

-- Client Revenue View (for client breakdown charts)
CREATE VIEW "client_revenue_view" AS
SELECT
    i.tenant_id,
    i.client_id,
    c.name AS client_name,
    c.client_code,
    SUM(i.total) AS total_invoiced,
    SUM(i.amount_paid) AS total_paid,
    SUM(i.total - i.amount_paid) AS outstanding,
    COUNT(i.id) AS invoice_count,
    MIN(i.issue_date) AS first_invoice_date,
    MAX(i.issue_date) AS last_invoice_date
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'paid', 'overdue')
GROUP BY i.tenant_id, i.client_id, c.name, c.client_code;