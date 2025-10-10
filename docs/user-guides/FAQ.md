# Frequently Asked Questions (FAQ)

**Last Updated**: 2025-10-10
**Version**: 1.0

This document answers common questions about Practice Hub. Questions are organized by topic for easy navigation.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & Access](#authentication--access)
3. [Client Management](#client-management)
4. [KYC/AML Onboarding](#kycaml-onboarding)
5. [Proposals & Pricing](#proposals--pricing)
6. [Task Management](#task-management)
7. [Time Tracking](#time-tracking)
8. [Invoicing](#invoicing)
9. [Documents](#documents)
10. [Client Portal](#client-portal)
11. [Technical Issues](#technical-issues)
12. [Security & Privacy](#security--privacy)
13. [Billing & Costs](#billing--costs)

---

## Getting Started

### What is Practice Hub?

Practice Hub is a comprehensive practice management platform for accounting and professional services firms. It manages:
- Client relationships (CRM)
- KYC/AML compliance onboarding
- Proposals and pricing
- Task and project management
- Time tracking and invoicing
- Document management
- Compliance tracking

### Who can use Practice Hub?

**Internal Users**:
- **Staff**: All firm employees (accountants, bookkeepers, consultants)
- **Admins**: System administrators with elevated permissions

**External Users**:
- **Clients**: Access via Client Portal with limited permissions
- **Prospects/Leads**: Receive onboarding invitations

### How do I get access?

**For Staff**:
1. Admin invites you via email
2. Click invitation link
3. Create password
4. Choose sign-in method (email/password or Microsoft)
5. Access granted based on role

**For Clients**:
1. Receive invitation from your account manager
2. Complete KYC/AML onboarding
3. Await admin approval
4. Receive portal access credentials

📖 **See**: [STAFF_GUIDE.md - Getting Started](./STAFF_GUIDE.md#getting-started)

### What browsers are supported?

**Recommended**:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Mobile**: Responsive design works on tablets and phones, but desktop recommended for complex tasks.

---

## Authentication & Access

### I forgot my password. How do I reset it?

**If you haven't signed in yet**:
1. Go to sign-in page
2. Click **"Forgot Password?"**
3. Enter your email
4. Check email for reset link (expires in 1 hour)
5. Click link and create new password

**If you're signed in**:
1. Go to Profile → Settings
2. Click **"Change Password"**
3. Enter current password and new password

**Still can't access?**
Contact your admin for a manual password reset.

### Can I sign in with Microsoft?

**Yes!** If configured by your organization:
1. Go to sign-in page
2. Click **"Sign in with Microsoft"**
3. Choose personal or work account
4. Authorize Practice Hub
5. Signed in automatically

**First-time Microsoft users**: Your email must match an existing invitation. Contact admin if issues occur.

📖 **See**: [docs/MICROSOFT_OAUTH_SETUP.md](../MICROSOFT_OAUTH_SETUP.md)

### Why was I signed out automatically?

**Session expiration**: Sessions expire after **7 days** of inactivity for security.

**Solution**:
- Sign in again
- Enable **"Remember Me"** (extends to 30 days)

**Multiple tabs**: Sessions sync across tabs. Signing out in one tab signs out all tabs.

### Can I access Practice Hub from my phone?

**Yes**, the interface is fully responsive. However:
- ✅ **Good for**: Viewing clients, checking tasks, logging time
- ⚠️ **Limited for**: Creating proposals (calculator has many fields)
- ❌ **Not recommended for**: Document uploads, complex pricing configuration

**Tip**: Use desktop for administrative tasks, mobile for quick checks.

---

## Client Management

### How do I create a new client?

**Two paths**:

**Path 1: From Lead** (recommended):
1. Create lead in Proposal Hub → Leads
2. Qualify lead
3. Send proposal
4. Click **"Convert to Client"** when won

**Path 2: Direct Creation**:
1. Go to Client Hub → Clients
2. Click **"Add Client"**
3. Fill company information
4. Send onboarding invitation

📖 **See**: [STAFF_GUIDE.md - Client Management](./STAFF_GUIDE.md#client-management)

### What's the difference between a Lead and a Client?

| | Lead | Client |
|---|---|---|
| **Stage** | Prospective | Active |
| **Access** | No portal access | Portal access after onboarding |
| **KYC Required** | No | Yes (UK MLR 2017) |
| **Billing** | No | Yes |
| **Status** | New → Converted/Lost | Onboarding → Active → Inactive |

**Workflow**: Lead → Proposal → Win → Convert → Onboarding → Active Client

### Can I delete a client?

**No direct deletion** due to compliance requirements. Use **soft delete**:

1. Go to Client Hub → Clients
2. Find client
3. Click **"Archive"** (changes status to `archived`)
4. Archived clients:
   - Hidden from default views
   - Can be restored if needed
   - Retained for 7 years (AML compliance)

**Why not delete?**: UK Money Laundering Regulations require 7-year retention of client records.

### How do I update client information?

1. Go to Client Hub → Clients
2. Click client name
3. Click **"Edit Details"**
4. Update fields
5. Click **"Save Changes"**

**Auto-updates**: Some fields auto-populate from Companies House API (if using UK company number).

### Why can't I see all clients?

**Multi-tenancy**: You only see clients for your organization (tenant).

**Filters**: Check filter settings:
- Status filter (active/inactive/archived)
- Account manager filter
- Search bar

**Permissions**: Some clients may be restricted based on role.

---

## KYC/AML Onboarding

### Why is KYC/AML onboarding required?

**Legal requirement**: UK Money Laundering Regulations (MLR) 2017 require all accountancy firms to:
- Verify client identity
- Screen for PEP, sanctions, watchlists
- Document verification process
- Retain records for 7 years

**Practice Hub compliance**: Automated KYC via LEM Verify ensures you meet obligations without manual paperwork.

📖 **See**: [CLIENT_ONBOARDING_GUIDE.md - Why Onboarding](./CLIENT_ONBOARDING_GUIDE.md#why-onboarding-is-required)

### How long does client onboarding take?

**Client time**: 15-20 minutes
- Questionnaire: 10 minutes
- Identity verification: 5-10 minutes

**Processing time**:
- **Auto-approval**: Instant (if clean verification)
- **Manual review**: 1-2 business days (if flagged)

### What happens if a client fails verification?

**Automatic re-verification flow**:
1. Client receives rejection email
2. Email includes reason for failure
3. Client clicks **"Start Re-Verification"**
4. Client retakes photos/submits new documents
5. System processes new verification

**Common failure reasons**:
- Blurry photos
- Expired documents
- Lighting issues
- Name mismatch

📖 **See**: [CLIENT_ONBOARDING_GUIDE.md - Troubleshooting](./CLIENT_ONBOARDING_GUIDE.md#troubleshooting)

### How do I review a flagged verification?

**For Admins**:
1. Go to Admin Panel → KYC/AML Review
2. See queue of flagged verifications
3. Click **"Review"** on item
4. Review detailed report:
   - Document verification results
   - Facial recognition scores
   - AML screening results (PEP, sanctions, watchlists)
5. Make decision:
   - **Approve**: Client becomes active, receives portal access
   - **Reject**: Client receives re-verification email

📖 **See**: [ADMIN_TRAINING.md - KYC/AML Review](./ADMIN_TRAINING.md#kycaml-review-queue)

### Can I manually approve a client without KYC?

**No** - this would violate UK MLR 2017. All clients must complete verification.

**Exception**: If LEM Verify service is down, contact support for manual workaround (requires admin documentation).

### What documents are accepted for verification?

**UK-Accepted ID Documents**:
- ✅ Passport (UK or international)
- ✅ Driving Licence (UK photocard)

**Not Accepted**:
- ❌ Paper driving licences
- ❌ Birth certificates
- ❌ Utility bills (not photo ID)
- ❌ Bank statements

📖 **See**: [CLIENT_ONBOARDING_GUIDE.md - Document Requirements](./CLIENT_ONBOARDING_GUIDE.md#document-requirements)

### How much does KYC verification cost?

**LEM Verify Pricing**: £1 per verification

**Included in fee**:
- Document verification
- Facial recognition
- Liveness detection
- AML screening (PEP, sanctions, watchlists, adverse media)

**When charged**:
- Initial verification: £1
- Re-verification (if failed): £1 per retry

**Cost savings**: Practice Hub uses LEM Verify (£1) instead of ComplyCube (£5), saving 80%.

---

## Proposals & Pricing

### How do I create a proposal?

**Step-by-step**:
1. Go to Proposal Hub → Calculator
2. Enter business information:
   - Company name
   - Industry (affects pricing)
   - Annual turnover
   - Monthly transactions
3. Select services (28 available across 7 categories)
4. Choose complexity for each service
5. Review calculated price
6. Click **"Generate Proposal"**
7. Proposal saved with snapshot of pricing

📖 **See**: [STAFF_GUIDE.md - Proposals & Leads](./STAFF_GUIDE.md#proposals--leads)

### How does the pricing calculator work?

**Pricing Model**:
- **138+ rules** with turnover/transaction bands
- **Complexity multipliers**: 1.0x (Clean), 1.25x (Average), 1.5x (Complex), 2.0x (Disaster)
- **Industry multipliers**: Construction (1.2x), Hospitality (1.15x), Retail (1.1x), etc.
- **Discounts**: Volume (5-15%), Rush (+30%), New Client (-10%)

**Example**:
- Service: Annual Accounts
- Base price for £500k turnover: £1,200
- Average complexity: £1,200 × 1.25 = £1,500
- Industry (Construction): £1,500 × 1.2 = £1,800
- New client discount: £1,800 × 0.9 = **£1,620**

### Can I manually override prices?

**Yes** (staff and admins):
1. In proposal calculator, after services selected
2. Click **"Override Price"** on service
3. Enter custom price
4. Add reason (for audit trail)
5. Price override recorded in activity log

**Why override?**:
- Special client relationships
- Competitive pricing
- Package deals
- Promotional discounts

### How do I update pricing rules?

**For Admins only**:
1. Go to Admin Panel → Pricing
2. **Service Components** tab: Add/edit services
3. **Pricing Rules** tab: Add/edit turnover/transaction bands
4. **Configuration** tab: Update multipliers and discounts
5. Click **"Save Changes"**

**Effect**: Changes apply immediately to new proposals (existing proposals use snapshot pricing).

📖 **See**: [ADMIN_TRAINING.md - Pricing Configuration](./ADMIN_TRAINING.md#pricing-configuration)

### What happens to old proposals when pricing changes?

**Snapshot storage**: Each proposal stores a snapshot of:
- Service prices at proposal creation time
- Complexity multipliers used
- Industry multipliers used
- Discounts applied

**Result**: Old proposals remain unchanged even if pricing rules update. This ensures:
- Historical accuracy
- Audit compliance
- Consistent client communication

### Can I export a proposal to PDF?

**Yes**:
1. Go to Proposal Hub → Proposals
2. Click proposal
3. Click **"Generate PDF"**
4. PDF created and stored in S3
5. Click **"Download PDF"** or **"Email to Client"**

**PDF includes**:
- Company branding
- Service breakdown
- Pricing details
- Terms and conditions

---

## Task Management

### How do I create a task?

1. Go to Practice Hub → Tasks
2. Click **"Create Task"**
3. Fill form:
   - Title (required)
   - Description
   - Client (optional, link to client)
   - Assigned to (default: you)
   - Due date
   - Priority (Low → Critical)
   - Estimated hours
4. Click **"Create"**

**Quick create**: Use **"+"** button in header for quick task creation from anywhere.

📖 **See**: [STAFF_GUIDE.md - Task Management](./STAFF_GUIDE.md#task-management)

### Can I assign tasks to multiple people?

**No** - each task can only have one assignee.

**Workaround**:
- Use **subtasks** for multi-person work
- Create parent task assigned to lead
- Create subtasks assigned to individual team members

**Example**:
- Parent: "Prepare Year-End Accounts for ABC Ltd" (assigned to manager)
  - Subtask 1: "Review trial balance" (assigned to accountant)
  - Subtask 2: "Prepare tax computation" (assigned to tax specialist)

### What do task statuses mean?

| Status | Meaning | Who Sets It |
|--------|---------|-------------|
| **Not Started** | Task created, no work yet | Default |
| **In Progress** | Actively being worked on | Assignee |
| **Blocked** | Cannot proceed (waiting on something) | Assignee |
| **On Hold** | Paused temporarily | Assignee/Manager |
| **In Review** | Completed, awaiting review | Assignee |
| **Approved** | Reviewed and approved | Reviewer |
| **Rejected** | Needs rework | Reviewer |
| **Completed** | Finished and accepted | Reviewer/Assignee |
| **Cancelled** | No longer needed | Manager |

### How do I track time on a task?

**Two methods**:

**Method 1: Manual Entry** (after work completed):
1. Go to Practice Hub → Time Tracking
2. Click **"Add Entry"**
3. Select task
4. Enter duration
5. Add description
6. Click **"Save"**

**Method 2: Timer** (during work):
1. Go to task detail page
2. Click **"Start Timer"**
3. Work on task
4. Click **"Stop Timer"** when done
5. Review and submit

📖 **See**: [STAFF_GUIDE.md - Time Tracking](./STAFF_GUIDE.md#time-tracking)

---

## Time Tracking

### What's the difference between billable and billed?

**Billable**: Time can be charged to client (but not yet invoiced)
- Mark as billable when entering time
- Appears in "unbilled time" reports
- Can be included in future invoices

**Billed**: Time has been invoiced to client
- Automatically set when time entry added to invoice
- No longer appears in unbilled time
- Locked from further editing

**Non-billable**: Internal time (admin, training, holiday)
- Never charged to client
- Tracked for capacity planning

### Do I need to submit time entries?

**Yes** - approval workflow:

1. **Draft**: You create time entry (editable)
2. **Submit**: You click "Submit for Approval" (locked)
3. **Review**: Manager reviews
4. **Approved/Rejected**: Manager decision
5. **If Rejected**: You edit and resubmit

**Why approval?**: Ensures accurate client billing and prevents errors.

### Can I edit submitted time entries?

**Submitted entries**: No (locked for manager review)

**To edit**:
1. Ask manager to reject entry
2. Manager adds rejection reason
3. Entry returns to "Draft" state
4. You edit entry
5. Resubmit for approval

**Approved entries**: Only admins can edit (audit trail required).

### How do I log holiday or sick time?

**Holiday**:
1. Practice Hub → Time Tracking → **"Add Entry"**
2. **Work Type**: Select "Holiday"
3. **Client**: Leave blank
4. **Duration**: Full day (7.5 hours)
5. **Date**: Holiday date
6. **Billable**: No

**Sick Time**:
- Same process, select **"Sick Leave"** as work type

**Other types**:
- Training
- Admin
- Business Development

### Can I see how much time I've logged this week?

**Yes**:
1. Go to Practice Hub → Time Tracking
2. Use **date range filter**: "This Week"
3. See total at bottom: "Total: 32.5 hours"

**Alternative**: Dashboard shows weekly time summary widget.

---

## Invoicing

### How do I create an invoice?

1. Go to Practice Hub → Invoices
2. Click **"Create Invoice"**
3. Select client
4. Enter invoice details (number, date, due date)
5. **Option A**: Add line items manually
6. **Option B**: Import unbilled time entries (recommended)
7. Review totals (subtotal, VAT, total)
8. Click **"Generate Invoice"**

**Best practice**: Use time entry import for accurate billing.

📖 **See**: [STAFF_GUIDE.md - Invoicing](./STAFF_GUIDE.md#invoicing)

### How do I import time entries to an invoice?

1. Create invoice (select client)
2. Click **"Import Time Entries"**
3. System shows unbilled time for this client
4. Select entries to include (or "Select All")
5. Click **"Import"**
6. Time entries converted to invoice line items
7. Entries automatically marked as "Billed"

### Can I edit an invoice after it's sent?

**Sent invoices**: No (locked for compliance)

**Workaround**:
1. **Cancel** original invoice (adds "Cancelled" watermark)
2. Create **new invoice** with corrections
3. Reference original invoice number in notes

**Why no editing?**: Audit trail and tax compliance.

### How do I record a payment?

1. Go to invoice detail page
2. Click **"Record Payment"**
3. Enter:
   - Payment date
   - Amount
   - Payment method (Bank Transfer, Card, Cash, Cheque)
   - Reference number
4. Click **"Save"**
5. Invoice status updates to "Paid" (or "Partially Paid")

### What invoice statuses exist?

| Status | Meaning |
|--------|---------|
| **Draft** | Created but not sent |
| **Sent** | Emailed to client |
| **Viewed** | Client opened email/PDF |
| **Overdue** | Past due date, unpaid |
| **Partially Paid** | Some payment received |
| **Paid** | Fully paid |
| **Cancelled** | Voided/cancelled |

---

## Documents

### How do I upload a document for a client?

1. Go to Client Hub → Clients → [Select Client]
2. Click **"Documents"** tab
3. Click **"Upload Document"**
4. Select file (max 50MB)
5. Choose folder (optional)
6. Add description
7. Click **"Upload"**

**Supported formats**: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP

### How do I organize documents into folders?

1. Client Documents tab
2. Click **"Create Folder"**
3. Name folder (e.g., "2024 Tax Returns")
4. Drag-and-drop documents into folder OR
5. Upload new documents directly to folder

**Nested folders**: Support up to 3 levels deep.

### Can I share a document with a client?

**Yes** - two methods:

**Method 1: Client Portal Access** (recommended):
- Clients with portal access automatically see their documents
- Controlled by folder permissions

**Method 2: Share Link**:
1. Go to document
2. Click **"Generate Share Link"**
3. Set expiration (1 day to 30 days)
4. Copy link and send to client
5. Link works without login

**Security**: Share links expire automatically and can be revoked.

### How do I download multiple documents at once?

1. Go to Documents
2. Check boxes next to documents
3. Click **"Download Selected"**
4. System creates ZIP file
5. Download ZIP

**Limit**: 20 documents per ZIP (performance).

---

## Client Portal

### How do clients get portal access?

**Workflow**:
1. Staff sends client portal invitation (after lead conversion)
2. Client receives email with onboarding link
3. Client completes KYC/AML onboarding
4. Admin approves verification (if flagged)
5. Client receives portal access credentials
6. Client can sign in

📖 **See**: [CLIENT_ONBOARDING_GUIDE.md](./CLIENT_ONBOARDING_GUIDE.md)

### What can clients see in the portal?

**Client Portal Access**:
- ✅ Their company information
- ✅ Proposals sent to them
- ✅ Invoices (current and past)
- ✅ Documents shared with them
- ✅ Compliance tasks assigned to them
- ✅ Contact their account manager
- ❌ Other clients' data (tenant isolation)
- ❌ Internal staff notes/comments
- ❌ Pricing configuration

### Can a client access multiple companies?

**Yes** - if they manage multiple entities:
1. Client receives invitation for each company
2. Client completes onboarding for each (separate KYC)
3. Client portal shows company switcher
4. Client selects company to view data

**Use case**: Directors managing multiple companies, group structures.

### How do I revoke a client's portal access?

**For Admins**:
1. Go to Admin Panel → Client Portal Management
2. Find client access record
3. Click **"Revoke Access"**
4. Confirm action
5. Client immediately signed out and cannot sign in

**Restore access**: Click "Restore Access" (if account not deleted).

---

## Technical Issues

### The page won't load. What should I do?

**Troubleshooting steps**:

1. **Refresh the page**: Press `Ctrl+R` (Windows) or `Cmd+R` (Mac)
2. **Clear cache**:
   - Chrome: `Ctrl+Shift+Delete` → Select "Cached images and files" → Clear
   - Firefox: `Ctrl+Shift+Delete` → Select "Cache" → Clear
   - Safari: Safari menu → Clear History → All History
3. **Try different browser**: Test if issue is browser-specific
4. **Check internet connection**: Verify you're online
5. **Restart browser**: Close all tabs and reopen

**Still not working?** Contact support with:
- Browser name and version
- Error message (if any)
- Screenshot of issue

### I uploaded a file but it's not showing. Why?

**Common causes**:

1. **File too large**: Max 50MB per file
   - **Solution**: Compress file or split into smaller files
2. **Unsupported format**: Check accepted formats
   - **Solution**: Convert to PDF, DOC, or JPG
3. **Upload interrupted**: Connection dropped during upload
   - **Solution**: Re-upload file
4. **Processing delay**: Large files take time to process
   - **Wait 30 seconds and refresh**

### Forms keep showing errors. How do I fix them?

**Common form errors**:

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "This field is required" | Empty required field | Fill in the field |
| "Invalid email format" | Wrong email format | Check for typos (must have @) |
| "Date must be in future" | Past date entered | Enter future date |
| "Phone number invalid" | Wrong format | Use format: 020 1234 5678 |
| "Password too short" | < 8 characters | Use at least 8 characters |

**Red underlines**: Fields with errors have red underlines. Scroll up to find them.

### The calculator shows weird prices. Is it broken?

**Check these first**:

1. **Turnover amount**: £500k vs £500 makes huge difference
   - Enter as **numeric only** (500000, not £500,000)
2. **Industry selected**: Some industries have higher multipliers
3. **Complexity level**: "Disaster" costs 2x "Clean"
4. **Discounts applied**: Volume discount may reduce price

**Still wrong?**
Contact admin - pricing rules may need updating.

### I can't find a client/task/document. Where is it?

**Search tips**:

1. **Use search bar**: Top right corner of tables
2. **Check filters**: Clear all filters (click "Reset Filters")
3. **Check status**: Archived items hidden by default
   - Enable **"Show Archived"** checkbox
4. **Check account manager**: Filter may be limiting results
5. **Check date range**: Some views filter by date

**Advanced search**: Use wildcards (e.g., "ABC*" finds "ABC Ltd", "ABC Corp")

---

## Security & Privacy

### Is my data secure?

**Yes** - multiple security layers:

**Data Protection**:
- 🔒 **Encryption in transit**: TLS 1.3 (HTTPS)
- 🔒 **Encryption at rest**: PostgreSQL encryption
- 🔒 **Password hashing**: bcrypt (industry standard)
- 🔒 **Session security**: HTTP-only cookies, CSRF protection

**Access Control**:
- 🔐 **Multi-tenancy**: You only see your organization's data
- 🔐 **Role-based access**: Staff/Admin permissions enforced
- 🔐 **Activity logging**: All actions audited

**Compliance**:
- ✅ **GDPR compliant**: Right to access, rectification, erasure
- ✅ **UK MLR 2017 compliant**: 7-year retention
- ✅ **ISO 27001 aligned**: Information security best practices

### Can other organizations see my data?

**No** - strict tenant isolation:

- Each organization has unique tenant ID
- All database queries filter by tenant
- Users cannot access other tenants' data (enforced at database level)
- Admins from one organization cannot access another organization's data

**Example**: If you work for "ABC Accountants", you cannot see clients/data for "XYZ Accountants".

### How long do you keep my data?

**Active data**: Retained indefinitely while account active

**Deleted data**: Soft-deleted (archived) for 7 years (UK MLR 2017 requirement)

**KYC/AML data**: Retained for **7 years** minimum (legal requirement)

**Time entries**: Retained for **6 years** (HMRC requirement)

**After retention period**: Data permanently deleted (GDPR "right to erasure")

### Who can see my activity logs?

**Activity logs** track:
- User actions (create, update, delete)
- Timestamps
- IP addresses
- Changed fields (before/after)

**Access**:
- ✅ **Admins**: Full access to all logs
- ✅ **Managers**: Access to team member logs
- ❌ **Staff**: Cannot see other staff members' logs
- ❌ **Clients**: Cannot see any internal logs

**Why log activity?**: Audit trail for compliance, security, and dispute resolution.

### What is GDPR and how does it affect me?

**GDPR** = General Data Protection Regulation (EU/UK data protection law)

**Your rights**:
- **Right to access**: Request copy of your data
- **Right to rectification**: Correct inaccurate data
- **Right to erasure**: Delete data (subject to legal retention)
- **Right to data portability**: Export data in machine-readable format
- **Right to object**: Object to processing

**To exercise rights**: Contact your organization's Data Protection Officer or admin.

📖 **See**: [SECURITY.md](../SECURITY.md) *(coming soon)*

---

## Billing & Costs

### How much does Practice Hub cost?

**Contact your organization** - pricing is per-tenant and depends on:
- Number of users
- Number of clients
- Storage usage
- KYC verifications per month

**Typical costs**:
- Platform subscription: £X/month per organization
- KYC verifications: £1 per verification (pay-as-you-go)
- Storage: £X per GB/month (includes 100GB free)

### How much do KYC verifications cost?

**LEM Verify**: £1 per verification (charged to organization)

**Includes**:
- Document verification
- Facial recognition
- Liveness detection
- AML screening (PEP, sanctions, watchlists, adverse media)

**Billing**:
- Charged monthly in arrears
- Usage report available in Admin Panel

**Failed verifications**: Each re-verification costs £1 (so advise clients to take clear photos).

### Are there additional fees for storage?

**Storage included**: 100GB free per organization

**Overage pricing**: £X per GB/month beyond 100GB

**What counts toward storage?**
- Documents uploaded
- Proposal PDFs
- KYC identity documents
- Invoices and attachments

**Optimize storage**:
- Delete old documents (subject to retention requirements)
- Compress large files before uploading
- Use external links for large media files

### Can I export my data if I cancel?

**Yes** - data portability:

1. Contact admin 30 days before cancellation
2. Admin requests full data export
3. Receive ZIP file with:
   - All client records (CSV)
   - All documents (original files)
   - All time entries, invoices (CSV)
   - Complete database export (SQL)
4. 30-day grace period to download
5. After 30 days, data permanently deleted

**GDPR right**: Data portability guaranteed.

---

## Still Have Questions?

### Contact Support

**For Staff**:
- **Email**: support@practicehub.com *(update with actual email)*
- **Slack**: #practice-hub-support *(if applicable)*
- **Phone**: [Support phone number]

**For Clients**:
- **Email**: clientsupport@practicehub.com *(update with actual email)*
- **Phone**: [Client support phone number]
- **Portal**: Message your account manager via Client Portal

### Documentation Links

- 📘 [Staff Guide](./STAFF_GUIDE.md) - Complete user guide for staff
- 📙 [Client Onboarding Guide](./CLIENT_ONBOARDING_GUIDE.md) - KYC/AML onboarding steps
- 📕 [Admin Training Manual](./ADMIN_TRAINING.md) - Administrator reference
- 📗 [Environment Variables](../ENVIRONMENT_VARIABLES.md) - Configuration reference
- 📖 [Database Schema](../DATABASE_SCHEMA.md) - Database documentation
- 📓 [Changelog](../../CHANGELOG.md) - Version history and release notes

### Reporting Issues

**Found a bug?**
1. Check this FAQ and documentation first
2. Try basic troubleshooting (refresh, clear cache)
3. If issue persists:
   - Note: What you were doing when error occurred
   - Screenshot error message
   - Browser name and version
   - Date and time of issue
4. Email support with details above

**Feature request?**
- Email support with:
  - What you want to do
  - Why current system doesn't work
  - Expected behavior vs actual behavior

---

**Last Updated**: 2025-10-10
**Version**: 1.0
**Next Review**: 2026-01-10
