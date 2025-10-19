# Staff User Guide

Complete guide for using Practice Hub as a staff member.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation](#navigation)
3. [Dashboard Overview](#dashboard-overview)
4. [Client Management](#client-management)
5. [Task Management](#task-management)
6. [Time Tracking](#time-tracking)
7. [Proposals & Leads](#proposals--leads)
8. [KYC/AML Onboarding](#kyc-aml-onboarding)
9. [Compliance Tracking](#compliance-tracking)
10. [Invoicing](#invoicing)
11. [Portal Links](#portal-links)
12. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### First Time Login

1. **Check Your Email** for an invitation from your admin
2. **Click the invitation link** (valid for 7 days)
3. **Set your password** (minimum 8 characters, must include letters and numbers)
4. **Sign in** at `https://app.innspiredaccountancy.com/sign-in`

### Sign In Options

**Option 1: Email & Password**
1. Enter your work email address
2. Enter your password
3. Click "Sign In"

**Option 2: Microsoft Account**
1. Click "Sign in with Microsoft"
2. Select your Microsoft work account
3. Authorize Practice Hub
4. Select your organization (if you have access to multiple)

### Your Profile

Access your profile settings from the user menu (top right):
- Update your name and profile picture
- Change your password
- Set your hourly billing rate
- View your activity history

---

## Navigation

### Main Navigation

Practice Hub is organized into hubs accessible from the sidebar:

| Hub | Purpose | Access |
|-----|---------|--------|
| **Practice Hub** | Main dashboard, quick actions | All users |
| **Client Hub** | Client management, CRM | All users |
| **Proposal Hub** | Leads, proposals, pricing calculator | All users |
| **Admin Panel** | User management, KYC review, settings | Admins only |

### Quick Actions

Use the quick action buttons on dashboards to:
- Add new clients
- Create tasks
- Start time tracking
- Generate proposals
- View recent activity

---

## Dashboard Overview

### Practice Hub Dashboard

Your main dashboard shows:

**Key Metrics**:
- Total clients
- Active tasks
- Billable hours (this month)
- Revenue (this month)

**Charts**:
- Revenue trend (last 12 months)
- Client growth
- Task completion rate

**Widgets**:
- Recent activity feed
- Overdue tasks (requires action)
- Upcoming compliance deadlines
- Top clients by revenue

**What to do daily**:
1. Check overdue tasks widget
2. Review upcoming compliance widget
3. Check recent activity for updates
4. Log time for yesterday's work

---

## Client Management

### Viewing Clients

**Navigate**: Client Hub → Clients

**Client List View**:
- **Search**: Type client name, email, or code
- **Filter**: By status (Active, Onboarding, Prospect, etc.)
- **Sort**: By name, status, or account manager
- **Quick View**: Click client row for summary

**Client Statuses**:
- **Prospect**: Potential client, not yet onboarded
- **Onboarding**: KYC/AML in progress
- **Active**: Fully onboarded, receiving services
- **Inactive**: Services paused
- **Archived**: No longer a client

### Adding a New Client

1. Click **"Add Client"** button
2. Fill in **Basic Information**:
   - Client name (required)
   - Email address
   - Phone number
   - Company type (Individual, Limited Company, Sole Trader, etc.)
3. Add **Address Details** (optional)
4. Add **Business Information**:
   - VAT number
   - Companies House registration number
   - Incorporation date
   - Financial year end (MM-DD format)
5. Assign **Account Manager** (yourself or another staff member)
6. Add **Internal Notes** (private, not visible to client)
7. Click **"Create Client"**

**What happens next**:
- Client status is set to "Prospect" by default
- Activity log records client creation
- Account manager receives notification (if enabled)

### Viewing Client Details

**Navigate**: Client Hub → Clients → Click client name

**Tabs**:

**1. Overview**
- Client information
- Contact details
- Account manager
- Health score (0-100, based on engagement and payment history)

**2. Contacts**
- Primary and secondary contacts
- Add new contacts
- Edit contact details
- Mark primary contact

**3. Directors** (for companies)
- Company directors from Companies House
- Manual director entries
- Officer roles and appointment dates
- Active/resigned status

**4. PSCs** (for companies)
- Persons with Significant Control from Companies House
- Nature of control (ownership, voting rights, etc.)
- Active/ceased status

**5. Services**
- Services assigned to this client
- Custom rates (if different from standard)
- Service start and end dates
- Add/remove services

**6. Tasks**
- All tasks for this client
- Create new task
- Filter by status, assignee, due date

**7. Documents**
- Client document library
- Upload new documents
- Organize in folders
- Share documents (generate share link)

**8. Compliance**
- Compliance items (VAT returns, annual accounts, etc.)
- Due dates and reminders
- Completion status

**9. Activity**
- Complete audit trail
- All changes to client record
- User who made each change
- Timestamps

### Editing Client Information

1. Navigate to client detail page
2. Click **"Edit Client"** button
3. Update fields as needed
4. Click **"Save Changes"**

**Note**: All changes are logged in the activity tab.

---

## Task Management

### Viewing Tasks

**Navigate**: Practice Hub → Tasks widget OR Client Hub → Clients → [Client] → Tasks

**Task List View**:
- **Filter by**:
  - Status (Pending, In Progress, Completed, etc.)
  - Priority (Low, Medium, High, Urgent, Critical)
  - Assignee (My Tasks, Unassigned, All Tasks)
  - Due date (Overdue, Due Today, Due This Week)
- **Sort by**: Due date, Priority, Created date, Status
- **Color coding**:
  - Red: Overdue
  - Orange: Due today
  - Yellow: Due this week
  - Green: Completed

### Creating a Task

**Method 1: From Dashboard**
1. Click **"New Task"** quick action
2. Fill in task details
3. Click **"Create Task"**

**Method 2: From Client Page**
1. Navigate to client → Tasks tab
2. Click **"Add Task"**
3. Client is pre-selected
4. Fill in details
5. Click **"Create Task"**

**Task Fields**:
- **Title** (required): Brief description
- **Description** (optional): Detailed instructions
- **Client** (optional): Link to client
- **Assigned To** (required): Staff member responsible
- **Reviewer** (optional): Staff member who will review
- **Due Date** (optional): Target completion date
- **Priority** (required): Low, Medium, High, Urgent, Critical
- **Status** (required): Pending, In Progress, etc.
- **Estimated Hours** (optional): Time estimate
- **Category** (optional): For grouping tasks

**Task Statuses**:
- **Pending**: Not yet started
- **In Progress**: Currently working on
- **Records Received**: Client documents received
- **Queries Sent**: Waiting for client response
- **Queries Received**: Client responded, action needed
- **Review**: Awaiting reviewer approval
- **Completed**: Task finished
- **Cancelled**: Task cancelled
- **Blocked**: Stuck, cannot proceed

### Working on Tasks

**Updating Task Status**:
1. Navigate to task detail page
2. Select new status from dropdown
3. Status updates automatically

**Logging Progress**:
1. Update **Progress** percentage (0-100%)
2. Progress bar updates visually

**Adding Notes**:
1. Scroll to **Notes** section
2. Add internal notes (not visible to client)
3. Click **"Save"**

**Completing a Task**:
1. Update status to **"Completed"**
2. System records completion timestamp
3. If reviewer assigned, status changes to **"Review"**

**Tracking Time**:
- Use Time Tracking feature (see [Time Tracking](#time-tracking))
- Link time entries to tasks
- Actual hours tracked automatically

---

## Time Tracking

### Why Track Time?

- **Billing accuracy**: Ensure clients are billed correctly
- **Profitability analysis**: Understand which clients/services are profitable
- **Resource planning**: Identify capacity constraints
- **Performance metrics**: Track productivity and efficiency

### Creating a Time Entry

**Navigate**: Practice Hub → Time Tracking OR Client Hub → Time Tracking

**Method 1: Manual Entry**
1. Click **"New Time Entry"**
2. Select **Date**
3. Select **Client** (if billable work)
4. Select **Task** (optional)
5. Select **Service** (optional)
6. Select **Work Type**:
   - Work (billable client work)
   - Admin (internal, non-billable)
   - Training
   - Meeting
   - Business Development
   - Research
   - Holiday
   - Sick
   - Time Off in Lieu
7. Enter **Hours** (decimal format: 1.5 = 1 hour 30 minutes)
8. OR enter **Start Time** and **End Time** (hours calculated automatically)
9. Add **Description** (what you worked on)
10. Check **Billable** if client should be charged
11. Enter **Rate** (pre-filled with your hourly rate, adjustable)
12. Amount calculated automatically (hours × rate)
13. Click **"Save Time Entry"**

**Method 2: Start Timer** (if available)
1. Click **"Start Timer"**
2. Work on task
3. Click **"Stop Timer"**
4. Review and save time entry

### Time Entry Workflow

**1. Draft**: Entry created, not yet submitted
**2. Submitted**: Entry submitted for approval
**3. Approved**: Entry approved, can be billed
**4. Rejected**: Entry rejected, needs revision

**Submitting for Approval**:
1. Navigate to Time Tracking
2. Select draft entries
3. Click **"Submit for Approval"**
4. Manager reviews and approves/rejects

**Editing Time Entries**:
- **Draft entries**: Edit freely
- **Submitted entries**: Request un-submission from manager
- **Approved entries**: Cannot edit (prevents fraud)

### Viewing Your Time

**My Timesheet**:
- View all your time entries
- Group by week, month, client, or project
- Filter by date range, client, billable status
- Export to CSV

**Summary Statistics**:
- Total hours (this week/month)
- Billable hours
- Billable amount
- Non-billable hours
- Breakdown by client
- Breakdown by work type

---

## Proposals & Leads

### Lead Management

**Navigate**: Proposal Hub → Leads

### Adding a New Lead

1. Click **"Add Lead"**
2. Fill in **Contact Information**:
   - First name and last name (required)
   - Email (required)
   - Phone and mobile
   - Position/job title
3. Fill in **Company Information**:
   - Company name
   - Website
   - Industry
   - Estimated turnover (for pricing)
   - Estimated employees
4. Add **Lead Details**:
   - Source (how they found you: Referral, Website, Cold Call, etc.)
   - Interested services (select from list)
   - Qualification score (1-10, how likely to convert)
5. Assign **To** yourself or another staff member
6. Add **Notes**
7. Set **Next Follow-Up Date** (reminder)
8. Click **"Create Lead"**

### Working with Leads

**Lead Statuses**:
- **New**: Just created, not yet contacted
- **Contacted**: Initial contact made
- **Qualified**: Assessed as viable prospect
- **Proposal Sent**: Proposal generated and sent
- **Negotiating**: In discussion about terms
- **Converted**: Became a client
- **Lost**: Did not convert

**Updating Lead Status**:
1. Navigate to lead detail page
2. Select new status from dropdown
3. Add notes explaining status change
4. Click **"Save"**

**Converting Lead to Client**:
1. Navigate to lead detail page
2. Click **"Convert to Client"**
3. Review pre-filled client information
4. Make any necessary adjustments
5. Click **"Create Client"**
6. Lead status automatically changes to "Converted"
7. Lead record preserved for reporting

### Creating a Proposal

**Navigate**: Proposal Hub → Calculator

**Step 1: Business Information**
1. Select **Lead** (if creating from lead) OR enter company name
2. Enter **Industry** (affects pricing multipliers)
3. Enter **Annual Turnover** (£)
4. Enter **Monthly Transactions** (for bookkeeping pricing)
5. Click **"Next"**

**Step 2: Service Selection**

**Service Categories**:
- **Compliance**: Annual accounts, tax returns, confirmation statements
- **VAT**: VAT returns, registrations
- **Bookkeeping**: Transaction processing, bank reconciliation
- **Payroll**: Payroll processing, RTI submissions
- **Management**: Management accounts, forecasting
- **Secretarial**: Company secretarial services
- **Tax Planning**: Tax planning and advisory
- **Add-ons**: One-off services

**For each service**:
1. Click service card to select
2. Select **Complexity Level** (if applicable):
   - **Clean**: Well-organized records, simple structure
   - **Average**: Some issues, normal complexity
   - **Complex**: Messy records, complex structure
   - **Disaster**: Major issues, requires extensive cleanup
3. Enter **Additional Parameters** (e.g., number of employees for payroll)
4. Price calculates automatically based on:
   - Turnover band
   - Transaction volume
   - Complexity multiplier
   - Industry multiplier
   - Any applicable discounts

**Step 3: Review & Adjust**
1. Review **Monthly Total**
2. Review **Annual Total**
3. Apply **Discounts** (if authorized):
   - Volume discount (multiple services)
   - New client discount
   - Rush job premium
4. Add **Custom Terms** (optional)
5. Select **Pricing Model**:
   - Model A (preferred)
   - Model B (alternative calculation method)
6. Click **"Generate Proposal"**

**Step 4: Review Proposal**
1. Review generated PDF preview
2. Make any final adjustments
3. Click **"Save Proposal"**

**Step 5: Send Proposal**
1. Navigate to Proposal Hub → Proposals → [Your Proposal]
2. Click **"Send Proposal"**
3. Email sent to lead/client automatically
4. Proposal status changes to "Sent"
5. Track when client views proposal (status → "Viewed")

### E-Signature Workflow

If e-signatures are enabled:

1. Client receives proposal via email
2. Client reviews proposal
3. Client clicks **"Sign Proposal"**
4. DocuSeal e-signature interface opens
5. Client signs electronically
6. System receives webhook notification
7. Proposal status → "Signed"
8. Signed PDF stored in S3
9. Admin receives notification

---

## KYC/AML Onboarding

### Overview

When a lead converts to a client, they must complete KYC/AML (Know Your Customer / Anti-Money Laundering) onboarding to comply with UK Money Laundering Regulations 2017.

**Your Role**:
- Initiate onboarding for new clients
- Monitor onboarding progress
- Review flagged verifications (admins only)
- Approve or reject onboarding (admins only)

### Starting Onboarding

**Automatic**: When you convert a lead to client, onboarding is created automatically.

**Manual**: For existing clients:
1. Navigate to Client Hub → Clients → [Client]
2. Click **"Start Onboarding"**
3. System creates onboarding session
4. Client receives invitation email

### Onboarding Workflow

**Client's Steps** (automated):
1. **Receive invitation email**
2. **Upload ID document** (passport or driving licence)
3. **Complete AML questionnaire** (5 categories):
   - Personal Information (AI-extracted from ID)
   - Business Information
   - Source of Funds
   - Beneficial Owners
   - Declarations
4. **Submit for verification**
5. **Complete LEM Verify check**:
   - Document verification
   - Facial recognition (facematch)
   - Liveness detection
   - AML screening (PEP, sanctions, watchlists, adverse media)
6. **Receive outcome**

**Your Monitoring**:
- Check onboarding status in client record
- Review progress percentage
- See which step client is on
- View completion timeline

### Auto-Approval

System automatically approves if all checks pass:
- ✅ Document verified
- ✅ Facematch passed (score > 80%)
- ✅ Liveness passed (score > 80%)
- ✅ AML clear (no matches)

**When auto-approved**:
- Client status → "Active"
- Client portal access granted automatically
- Welcome email sent
- You receive notification

### Manual Review (Admins Only)

**Navigate**: Admin Panel → KYC Review Queue

**Review Queue** shows verifications requiring manual review:
- Failed document verification
- Low facematch score (< 80%)
- Low liveness score (< 80%)
- AML matches (PEP, sanctions, watchlist, adverse media)

**Reviewing a Verification**:
1. Click **"Review"** on flagged verification
2. Review **Document Verification** results
3. Review **Biometric Verification** (facematch & liveness scores)
4. Review **AML Screening** results:
   - PEP (Politically Exposed Person) match
   - Sanctions match
   - Watchlist match
   - Adverse media match
5. Review **Client Responses** to questionnaire
6. Review **Document Images** (ID document photos)
7. Make decision: **Approve** or **Reject**

**Approving**:
1. Click **"Approve Onboarding"**
2. System:
   - Updates client status → "Active"
   - Grants portal access
   - Sends approval email to client
   - Logs approval in activity trail
   - Marks verification as approved

**Rejecting**:
1. Click **"Reject Onboarding"**
2. Enter **Rejection Reason** (client will see this)
3. Click **"Confirm Rejection"**
4. System:
   - Sends rejection email with reason
   - Offers re-verification option to client
   - Logs rejection in activity trail
   - Client can upload new documents and try again

**Re-Verification**:
If client needs to retry:
1. Navigate to client record
2. Click **"Start Re-Verification"**
3. New verification session created
4. Client receives email with re-verification link
5. Client uploads new documents
6. Process repeats

---

## Compliance Tracking

### Compliance Items

**Navigate**: Client Hub → Compliance OR Client Hub → Clients → [Client] → Compliance

### Adding a Compliance Item

1. Click **"Add Compliance Item"**
2. Select **Client**
3. Enter **Title** (e.g., "VAT Return Q3 2024")
4. Select **Type**:
   - VAT Return
   - Annual Accounts
   - CT600 (Corporation Tax Return)
   - Confirmation Statement
   - Self-Assessment Tax Return
   - PAYE/CIS Returns
   - Other
5. Enter **Description** (optional details)
6. Set **Due Date** (required)
7. Set **Reminder Date** (optional, get notified before due date)
8. Select **Priority**: Low, Medium, High, Urgent
9. Assign **To** staff member (yourself or colleague)
10. Add **Notes** (internal)
11. Click **"Create Compliance Item"**

### Managing Compliance Items

**Filtering**:
- By client
- By status (Pending, In Progress, Completed, Overdue)
- By type
- By assignee
- By due date range

**Updating Status**:
1. Click compliance item
2. Update status to:
   - **Pending**: Not started
   - **In Progress**: Working on it
   - **Completed**: Finished and filed
   - **Overdue**: Missed deadline
3. Status updates automatically

**Marking Complete**:
1. Update status → **"Completed"**
2. System records completion timestamp
3. Compliance item moves to "Completed" tab
4. Client notified (if enabled)

**Dashboard Widget**:
- Upcoming compliance (next 30 days) shown on dashboard
- Overdue compliance highlighted in red
- Click widget item to open compliance details

---

## Invoicing

### Creating an Invoice

**Navigate**: Client Hub → Invoices OR Client Hub → Clients → [Client] → Invoices

1. Click **"New Invoice"**
2. Select **Client**
3. Enter **Invoice Number** (auto-generated, editable)
4. Set **Issue Date** (default: today)
5. Set **Due Date** (default: 30 days from issue)
6. Add **Line Items**:
   - **Description**: Service provided
   - **Quantity**: Number of units (hours, projects, etc.)
   - **Rate**: Price per unit
   - **Amount**: Automatically calculated (quantity × rate)
   - Add more items as needed
7. **Subtotal** calculates automatically
8. Enter **Tax Rate** (default: 20% VAT)
9. **Tax Amount** calculates automatically
10. Enter **Discount** (optional, £ amount)
11. **Total** calculates automatically
12. Add **Invoice Notes** (visible to client)
13. Add **Payment Terms** (e.g., "Net 30 days")
14. Add **Purchase Order Number** (if client provided one)
15. Click **"Save Invoice"**

**Invoice Statuses**:
- **Draft**: Not yet sent to client
- **Sent**: Sent to client, awaiting payment
- **Paid**: Payment received
- **Overdue**: Past due date, not paid
- **Cancelled**: Invoice cancelled

### Importing Time Entries

**Automatic Line Items from Time Entries**:
1. When creating invoice, click **"Import Time Entries"**
2. Select client
3. Select date range
4. System shows **unbilled time entries** (billable = true, billed = false)
5. Select entries to include
6. Click **"Import"**
7. Line items created automatically:
   - Description from time entry description
   - Quantity = hours logged
   - Rate = rate from time entry
   - Amount = hours × rate
8. Review and adjust as needed
9. Click **"Save Invoice"**

**Note**: Imported time entries are marked as "billed" to prevent duplicate billing.

### Sending an Invoice

1. Navigate to invoice detail page
2. Click **"Send Invoice"**
3. Email automatically sent to client primary contact
4. Invoice status → "Sent"
5. PDF attached to email

### Recording Payments

1. Navigate to invoice detail page
2. Click **"Record Payment"**
3. Enter **Amount Paid**
4. Enter **Payment Date**
5. Add **Payment Notes** (optional: check number, reference, etc.)
6. Click **"Save Payment"**
7. If amount paid = total, invoice status → "Paid"
8. If amount paid < total, partial payment recorded, status remains "Sent"

### Viewing Invoice Reports

**Navigate**: Client Hub → Invoices → Reports

**Available Reports**:
- **Outstanding Invoices**: Unpaid invoices with aging
- **Paid Invoices**: Payment history
- **Revenue by Client**: Top clients by revenue
- **Revenue by Service**: Most profitable services
- **Overdue Invoices**: Invoices past due date

**Export Options**:
- Export to CSV
- Export to PDF
- Print

---

## Portal Links

### Accessing Portal Links

**Navigate**: Practice Hub → Portal (or sidebar icon)

### What are Portal Links?

Quick access to commonly used external tools and internal pages:

**Categories**:
- **Practice Hub**: Internal Practice Hub pages
- **Client Tools**: Xero, HMRC Gateway, Companies House, etc.
- **Team Tools**: Slack, Google Workspace, Microsoft 365
- **Resources**: Knowledge base, templates, guides
- **Utilities**: Calculators, converters, reference materials

### Using Portal Links

1. Browse categories on left sidebar
2. Click category to view links
3. Click link card to open
4. External links open in new tab (by default)
5. Internal links open in same window

### Favoriting Links

1. Hover over link card
2. Click ⭐ **star icon**
3. Link added to **"Favorites"** section at top
4. Click star again to unfavorite

**Your favorites are personal** - other users don't see them.

### Requesting New Links

If you need a link that's not available:
1. Contact your admin
2. Provide:
   - Link URL
   - Title and description
   - Suggested category
   - Who should have access (all staff, or specific roles)

---

## Tips & Tricks

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search (if enabled) |
| `Ctrl/Cmd + /` | Open help menu |
| `Esc` | Close modal/dialog |
| `Tab` | Navigate form fields |

### Quick Actions

- **Right-click** client in list → context menu with quick actions
- **Double-click** client → open detail page
- **Click + drag** tasks to re-order (if enabled)

### Efficient Workflows

**Morning Routine**:
1. Check dashboard for overdue tasks
2. Review upcoming compliance deadlines
3. Check KYC review queue (if admin)
4. Respond to any client portal messages

**End of Day Routine**:
1. Log all time for the day
2. Update task statuses
3. Complete any outstanding timesheets
4. Set tasks for tomorrow

**Weekly Routine**:
1. Submit timesheets for approval
2. Review open proposals
3. Follow up with leads
4. Check compliance calendar for next week

### Filters and Search

**Advanced Filters**:
- Combine multiple filters (e.g., client status + account manager)
- Save filter presets (if available)
- Clear all filters with "Reset" button

**Search Tips**:
- Search is case-insensitive
- Searches across multiple fields (name, email, code, etc.)
- Use quotes for exact match: `"John Smith"`
- Use minus for exclusion: `-archived`

### Batch Operations

**Select Multiple Items**:
1. Check checkboxes next to items
2. Use **"Select All"** to select all on page
3. Use **"Select None"** to deselect all
4. Click batch action button (e.g., "Bulk Assign", "Bulk Delete")

**Available Batch Operations**:
- Assign multiple tasks to user
- Change status of multiple items
- Delete multiple items
- Export multiple items

### Mobile Tips

**Mobile-Friendly Features**:
- Responsive design works on phones and tablets
- Time tracking optimized for mobile
- Quick actions accessible from home screen (if PWA installed)

**Best Practices**:
- Use mobile for time tracking on the go
- Use desktop for complex tasks (proposals, invoicing)
- Install as PWA (Progressive Web App) for offline access

### Getting Help

**In-App Help**:
- Look for **?** icons next to fields for tooltips
- Click **"Help"** in navigation menu for guides
- Use **search** to find specific features

**Contacting Support**:
- Email: support@innspiredaccountancy.com
- In-app feedback: Click **"Feedback"** button (if available)
- Report bugs with **"Report Issue"** button

**Training Resources**:
- Video tutorials (if available)
- Admin training guide: [ADMIN_TRAINING.md](/docs/user-guides/ADMIN_TRAINING.md)
- FAQ: [FAQ.md](/docs/user-guides/FAQ.md)

---

## Frequently Asked Questions

### General

**Q: I forgot my password. How do I reset it?**
A: Click "Forgot Password?" on the sign-in page, enter your email, and follow the reset link sent to your inbox.

**Q: Can I use my personal Microsoft account to sign in?**
A: Only if your admin has configured personal Microsoft accounts. Otherwise, use your work Microsoft account or email/password.

**Q: How do I change my hourly rate?**
A: Navigate to your profile (user menu → Profile) and update your hourly rate. This affects new time entries only, not existing ones.

### Time Tracking

**Q: Can I edit approved time entries?**
A: No, approved time entries are locked to prevent fraud. Contact your manager if you need to make corrections.

**Q: What's the difference between billable and billed?**
A: **Billable** = should be charged to client. **Billed** = already included on an invoice. Billable time becomes "billed" when imported to an invoice.

**Q: Can I track time for multiple clients in one day?**
A: Yes, create separate time entries for each client.

### Proposals

**Q: Can I customize the proposal PDF?**
A: Not directly. Contact your admin to adjust proposal template, branding, or terms.

**Q: What if the pricing calculator doesn't have the exact service I need?**
A: Use the closest match and add a note in "Custom Terms". Admins can add new services if needed frequently.

**Q: Can I see historical proposals for a client?**
A: Yes, navigate to Client Hub → Clients → [Client] → Proposals tab.

### KYC/AML

**Q: What if a client doesn't want to complete KYC?**
A: UK law requires KYC for all clients. Politely explain it's a legal requirement, not a choice.

**Q: How long does KYC verification take?**
A: Usually 2-5 minutes if client completes it in one session. LEM Verify processes checks instantly.

**Q: What if a client fails KYC?**
A: Admin reviews manually. Common reasons: poor photo quality, name mismatch, AML flags. Client can re-verify with better documents.

### Clients

**Q: Can I delete a client?**
A: No, clients can only be archived (to preserve audit trail). Contact admin if you need to delete.

**Q: How do I merge duplicate clients?**
A: Contact admin - this requires manual database operations.

**Q: Can a client have multiple account managers?**
A: Currently no, only one account manager per client. Use internal notes to track team members involved.

---

## Need More Help?

- **Admin Training Manual**: [ADMIN_TRAINING.md](/docs/user-guides/ADMIN_TRAINING.md)
- **Client Onboarding Guide**: [CLIENT_ONBOARDING_GUIDE.md](/docs/user-guides/CLIENT_ONBOARDING_GUIDE.md)
- **Full FAQ**: [FAQ.md](/docs/user-guides/FAQ.md)
- **Support Email**: support@innspiredaccountancy.com

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**For**: Staff Users (All Roles)
