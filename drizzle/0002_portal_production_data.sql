-- Insert default portal categories (production data)
INSERT INTO portal_categories (id, tenant_id, name, description, icon_name, color_hex, sort_order, is_active)
VALUES
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'Practice Hub', 'Internal practice management tools', 'Building2', '#ff8609', 1, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'Tax Resources', 'HMRC and tax-related resources', 'Calculator', '#dc3545', 2, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'Professional Tools', 'Accounting and business software', 'Briefcase', '#28a745', 3, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'Communication', 'Email and communication platforms', 'Mail', '#6f42c1', 4, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'File Management', 'Document storage and file systems', 'Folder', '#20c997', 5, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'Company Info', 'Company website and public information', 'Globe', '#007bff', 6, true),
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), 'External Tools', 'Third-party tools and services', 'ExternalLink', '#17a2b8', 7, true);

-- Insert Practice Hub internal links
INSERT INTO portal_links (id, tenant_id, category_id, title, description, url, is_internal, icon_name, sort_order, is_active, target_blank, requires_auth, allowed_roles)
VALUES
  -- Practice Hub Apps
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Client Hub', 'Client relationship and practice management', '/client-hub', true, 'Users', 1, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Proposal Hub', 'Lead management and proposal generation', '/proposal-hub', true, 'TrendingUp', 2, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Social Hub', 'Schedule and manage social media posts', '/social-hub', true, 'Share2', 3, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Employee Portal', 'Staff timesheets, leave and internal tools', '/employee-portal', true, 'Briefcase', 4, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Client Portal', 'Secure portal for client documents', '/client-portal', true, 'UserCheck', 5, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Bookkeeping Hub', 'Making Tax Digital compliant bookkeeping', '/bookkeeping-hub', true, 'BookOpen', 6, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Accounts Hub', 'Year-end accounts and financial reporting', '/accounts-hub', true, 'FileText', 7, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Payroll Hub', 'Process client payroll and RTI submissions', '/payroll-hub', true, 'DollarSign', 8, true, false, true, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Practice Hub' LIMIT 1),
   'Admin Panel', 'System administration and user management', '/admin', true, 'Shield', 9, true, false, true, '["admin"]'::jsonb),

  -- Tax Resources
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Tax Resources' LIMIT 1),
   'HMRC Online Services', 'Access HMRC Online Services for tax accounts and submissions',
   'https://www.gov.uk/log-in-register-hmrc-online-services', false, 'Building', 1, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Tax Resources' LIMIT 1),
   'HMRC Agent Services', 'Agent portal for managing client authorizations',
   'https://www.gov.uk/guidance/sign-in-to-your-agent-services-account', false, 'Users', 2, true, true, false, '["admin","member"]'::jsonb),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Tax Resources' LIMIT 1),
   'Companies House', 'File company information and annual returns',
   'https://www.gov.uk/government/organisations/companies-house', false, 'Building2', 3, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Tax Resources' LIMIT 1),
   'Tax Calculator', 'Calculate income tax and national insurance',
   'https://www.gov.uk/estimate-income-tax', false, 'Calculator', 4, true, true, false, NULL),

  -- Professional Tools
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'Xero', 'Cloud accounting software', 'https://www.xero.com', false, 'Cloud', 1, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'QuickBooks', 'Accounting and bookkeeping software', 'https://quickbooks.intuit.com', false, 'BookOpen', 2, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'Sage', 'Business management solutions', 'https://www.sage.com', false, 'Briefcase', 3, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'Receipt Bot', 'Automated receipt processing system', 'https://app.receipt-bot.com/', false, 'Receipt', 4, true, true, false, '["admin","member"]'::jsonb),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'Bright Manager', 'Practice management platform', 'https://manager.brightsg.com/overview', false, 'Sun', 5, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Professional Tools' LIMIT 1),
   'Inform Direct', 'Company secretarial software', 'https://www.informdirect.co.uk/', false, 'FileCheck', 6, true, true, false, '["admin","member"]'::jsonb),

  -- Communication
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Communication' LIMIT 1),
   'Email (Outlook)', 'Access company email through Microsoft Outlook',
   'https://outlook.office.com/mail/', false, 'Mail', 1, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Communication' LIMIT 1),
   'Microsoft Teams', 'Team collaboration and video conferencing',
   'https://teams.microsoft.com', false, 'Users', 2, true, true, false, NULL),

  -- File Management
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'File Management' LIMIT 1),
   'SharePoint Files', 'Access client documents in SharePoint',
   'https://innspiredaccountancycouk.sharepoint.com', false, 'Folder', 1, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'File Management' LIMIT 1),
   'OneDrive', 'Personal cloud storage',
   'https://onedrive.live.com', false, 'Cloud', 2, true, true, false, NULL),

  -- External Tools
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'External Tools' LIMIT 1),
   'ChatGPT', 'AI assistant for research and content generation',
   'https://chat.openai.com', false, 'MessageSquare', 1, true, true, false, NULL),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'External Tools' LIMIT 1),
   'Modulr', 'Approve payroll payments',
   'https://secure.modulrfinance.com/', false, 'CreditCard', 2, true, true, false, '["admin"]'::jsonb),

  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'External Tools' LIMIT 1),
   'Lead Tracker', 'Manage new client leads and onboarding',
   'https://leads.innspiredaccountancy.com/', false, 'UserPlus', 3, true, true, false, NULL),

  -- Company Info
  (gen_random_uuid(), (SELECT id FROM tenants LIMIT 1), (SELECT id FROM portal_categories WHERE name = 'Company Info' LIMIT 1),
   'Company Website', 'Visit our main company website',
   'https://innspiredaccountancy.co.uk/', false, 'Globe', 1, true, true, false, NULL);