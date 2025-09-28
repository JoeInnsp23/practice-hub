-- ============================================
-- DATABASE VIEWS FOR DENORMALIZED DATA
-- ============================================

-- Client Details View
-- Provides denormalized client data with account manager names
CREATE OR REPLACE VIEW client_details_view AS
SELECT
  c.id,
  c.tenant_id,
  c.client_code,
  c.name,
  c.type,
  c.status,
  c.email,
  c.phone,
  c.website,
  c.vat_number,
  c.registration_number,
  c.registration_number AS company_number, -- Alias for UI compatibility
  c.address_line1,
  c.address_line2,
  c.city,
  c.state,
  c.postal_code,
  c.country,
  c.incorporation_date,
  c.year_end,
  c.notes,
  c.metadata,
  c.created_at,
  c.updated_at,
  u.first_name || ' ' || u.last_name AS account_manager,
  u.id AS account_manager_id,
  -- Primary contact (first contact marked as primary)
  cc.first_name || ' ' || cc.last_name AS primary_contact_name,
  cc.email AS primary_contact_email,
  cc.phone AS primary_contact_phone,
  cc.position AS primary_contact_position
FROM clients c
LEFT JOIN users u ON c.account_manager_id = u.id
LEFT JOIN LATERAL (
  SELECT * FROM client_contacts
  WHERE client_id = c.id AND is_primary = true
  ORDER BY created_at
  LIMIT 1
) cc ON true;

-- Task Details View
-- Provides denormalized task data with client and user names
CREATE OR REPLACE VIEW task_details_view AS
SELECT
  t.id,
  t.tenant_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.progress,
  t.task_type,
  t.due_date,
  t.target_date,
  t.completed_at,
  t.estimated_hours,
  t.actual_hours,
  t.category,
  t.tags,
  t.is_recurring,
  t.recurring_pattern,
  t.metadata,
  t.created_at,
  t.updated_at,
  -- Client info
  c.id AS client_id,
  c.name AS client_name,
  c.client_code,
  -- Assignee info
  au.id AS assignee_id,
  au.first_name || ' ' || au.last_name AS assignee_name,
  -- Reviewer info
  ru.id AS reviewer_id,
  ru.first_name || ' ' || ru.last_name AS reviewer_name,
  -- Creator info
  cu.id AS created_by_id,
  cu.first_name || ' ' || cu.last_name AS created_by_name,
  -- Workflow info
  w.id AS workflow_id,
  w.name AS workflow_name,
  wi.id AS workflow_instance_id,
  wi.status AS workflow_instance_status,
  wi.current_stage_id,
  ws.name AS current_stage_name,
  wi.stage_progress
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN users au ON t.assigned_to_id = au.id
LEFT JOIN users ru ON t.reviewer_id = ru.id
LEFT JOIN users cu ON t.created_by_id = cu.id
LEFT JOIN workflows w ON t.workflow_id = w.id
LEFT JOIN task_workflow_instances wi ON wi.task_id = t.id
LEFT JOIN workflow_stages ws ON wi.current_stage_id = ws.id;

-- Time Entry Details View
-- Provides denormalized time entry data
CREATE OR REPLACE VIEW time_entry_details_view AS
SELECT
  te.id,
  te.tenant_id,
  te.date,
  te.start_time,
  te.end_time,
  te.hours,
  te.work_type,
  te.billable,
  te.billed,
  te.rate,
  te.amount,
  te.description,
  te.notes,
  te.status,
  te.submitted_at,
  te.approved_at,
  te.metadata,
  te.created_at,
  te.updated_at,
  -- User info
  u.id AS user_id,
  u.first_name || ' ' || u.last_name AS user_name,
  u.email AS user_email,
  -- Client info
  c.id AS client_id,
  c.name AS client_name,
  c.client_code,
  -- Task info
  t.id AS task_id,
  t.title AS task_title,
  -- Service info
  s.id AS service_id,
  s.name AS service_name,
  s.code AS service_code,
  -- Approver info
  au.id AS approved_by_id,
  au.first_name || ' ' || au.last_name AS approved_by_name
FROM time_entries te
LEFT JOIN users u ON te.user_id = u.id
LEFT JOIN clients c ON te.client_id = c.id
LEFT JOIN tasks t ON te.task_id = t.id
LEFT JOIN services s ON te.service_id = s.id
LEFT JOIN users au ON te.approved_by_id = au.id;

-- Invoice Details View
-- Provides denormalized invoice data
CREATE OR REPLACE VIEW invoice_details_view AS
SELECT
  i.id,
  i.tenant_id,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  i.paid_date,
  i.subtotal,
  i.tax_rate,
  i.tax_amount,
  i.discount,
  i.total,
  i.amount_paid,
  i.status,
  i.currency,
  i.notes,
  i.terms,
  i.po_number,
  i.metadata,
  i.created_at,
  i.updated_at,
  -- Client info
  c.id AS client_id,
  c.name AS client_name,
  c.client_code,
  c.email AS client_email,
  c.address_line1,
  c.address_line2,
  c.city,
  c.postal_code,
  c.country,
  c.vat_number,
  -- Creator info
  u.id AS created_by_id,
  u.first_name || ' ' || u.last_name AS created_by_name,
  -- Calculate outstanding amount
  (i.total - i.amount_paid) AS outstanding_amount
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN users u ON i.created_by_id = u.id;

-- Compliance Details View
-- Provides denormalized compliance data
CREATE OR REPLACE VIEW compliance_details_view AS
SELECT
  co.id,
  co.tenant_id,
  co.title,
  co.type,
  co.description,
  co.due_date,
  co.completed_date,
  co.reminder_date,
  co.status,
  co.priority,
  co.notes,
  co.attachments,
  co.metadata,
  co.created_at,
  co.updated_at,
  -- Client info
  c.id AS client_id,
  c.name AS client_name,
  c.client_code,
  -- Assignee info
  u.id AS assigned_to_id,
  u.first_name || ' ' || u.last_name AS assigned_to_name,
  -- Creator info
  cu.id AS created_by_id,
  cu.first_name || ' ' || cu.last_name AS created_by_name,
  -- Calculate days until due
  CASE
    WHEN co.status = 'completed' THEN NULL
    ELSE (co.due_date::date - CURRENT_DATE)
  END AS days_until_due
FROM compliance co
LEFT JOIN clients c ON co.client_id = c.id
LEFT JOIN users u ON co.assigned_to_id = u.id
LEFT JOIN users cu ON co.created_by_id = cu.id;

-- Service Details View
-- Provides denormalized service data with additional computed fields
CREATE OR REPLACE VIEW service_details_view AS
SELECT
  s.id,
  s.tenant_id,
  s.code,
  s.name,
  s.description,
  s.category,
  COALESCE(s.price, s.default_rate) AS price, -- Use price if available, otherwise default_rate
  s.price_type,
  s.duration,
  s.tags,
  s.is_active,
  s.metadata,
  s.created_at,
  s.updated_at,
  -- Count of active clients using this service
  (SELECT COUNT(DISTINCT cs.client_id)
   FROM client_services cs
   WHERE cs.service_id = s.id AND cs.is_active = true) AS active_client_count,
  -- Total revenue from this service (from invoiced time entries)
  (SELECT COALESCE(SUM(te.amount), 0)
   FROM time_entries te
   WHERE te.service_id = s.id AND te.billed = true) AS total_revenue
FROM services s;

-- Document Details View
-- Provides denormalized document data
CREATE OR REPLACE VIEW document_details_view AS
SELECT
  d.id,
  d.tenant_id,
  d.name,
  d.type,
  d.mime_type AS file_type,
  d.size,
  d.url,
  d.thumbnail_url,
  d.parent_id,
  d.path,
  d.description,
  d.tags,
  d.version,
  d.is_archived,
  d.is_public,
  d.share_token,
  d.share_expires_at,
  d.metadata,
  d.created_at,
  d.updated_at AS modified_at,
  -- Client info
  c.id AS client_id,
  c.name AS client_name,
  -- Task info
  t.id AS task_id,
  t.title AS task_title,
  -- Uploader info
  u.id AS uploaded_by_id,
  u.first_name || ' ' || u.last_name AS uploaded_by_name
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN tasks t ON d.task_id = t.id
LEFT JOIN users u ON d.uploaded_by_id = u.id;

-- Activity Feed View
-- Provides formatted activity log entries for UI display
CREATE OR REPLACE VIEW activity_feed_view AS
SELECT
  al.id,
  al.tenant_id,
  al.entity_type,
  al.entity_id,
  al.action,
  al.description,
  al.created_at AS timestamp,
  -- User info (denormalized for performance)
  COALESCE(al.user_name, u.first_name || ' ' || u.last_name) AS user_name,
  u.id AS user_id,
  -- Format activity type for UI
  CASE
    WHEN al.entity_type = 'task' THEN 'task'
    WHEN al.entity_type = 'client' THEN 'client'
    WHEN al.entity_type = 'invoice' THEN 'invoice'
    WHEN al.entity_type = 'time_entry' THEN 'time_entry'
    ELSE al.entity_type
  END AS type,
  -- Generate activity title based on action
  CASE
    WHEN al.action = 'created' THEN 'New ' || al.entity_type || ' added'
    WHEN al.action = 'updated' THEN al.entity_type || ' updated'
    WHEN al.action = 'deleted' THEN al.entity_type || ' removed'
    WHEN al.action = 'status_changed' THEN al.entity_type || ' status changed'
    ELSE al.action
  END AS title,
  al.metadata
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;