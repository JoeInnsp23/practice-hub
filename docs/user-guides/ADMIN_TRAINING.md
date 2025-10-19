# Admin Training Manual

Complete administrator guide for Practice Hub management and configuration.

---

## Table of Contents

1. [Admin Role Overview](#admin-role-overview)
2. [Accessing Admin Panel](#accessing-admin-panel)
3. [User Management](#user-management)
4. [KYC/AML Review Queue](#kyc-aml-review-queue)
5. [Pricing Configuration](#pricing-configuration)
6. [Portal Links Management](#portal-links-management)
7. [Client Portal Management](#client-portal-management)
8. [System Settings](#system-settings)
9. [Security & Permissions](#security--permissions)
10. [Monitoring & Reports](#monitoring--reports)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Admin Role Overview

### What Can Admins Do?

As an admin, you have full access to:

**User Management**:
- ✅ Invite new staff users
- ✅ Manage user roles and permissions
- ✅ Deactivate or reactivate users
- ✅ Reset user passwords
- ✅ View user activity logs

**KYC/AML Management**:
- ✅ Review flagged verifications
- ✅ Approve or reject onboarding
- ✅ Request re-verification
- ✅ View complete verification reports
- ✅ Access audit trail

**System Configuration**:
- ✅ Manage pricing components and rules
- ✅ Configure portal links and categories
- ✅ Set up client portal invitations
- ✅ Adjust system settings
- ✅ Export configuration backups

**Reporting & Analytics**:
- ✅ Access all system reports
- ✅ View audit logs for compliance
- ✅ Monitor system performance
- ✅ Generate custom exports

### Admin Responsibilities

**Security**:
- Protect your admin credentials (never share)
- Enable two-factor authentication if available
- Log out when not in use
- Report suspicious activity immediately

**Compliance**:
- Review KYC queue daily (or as items appear)
- Maintain audit trail documentation
- Follow legal requirements for data retention
- Ensure staff training is current

**System Maintenance**:
- Keep pricing data current
- Update portal links as services change
- Monitor user access and permissions
- Review system logs regularly

**Support**:
- Assist users with access issues
- Handle escalated technical problems
- Coordinate with developers for issues beyond your scope

---

## Accessing Admin Panel

### Navigation

**From any page**:
1. Click **sidebar menu icon** (☰)
2. Click **"Admin Panel"**
3. Admin dashboard loads

**Direct URL**: `/admin` (if logged in as admin)

**Access Control**:
- Only users with `admin` or `org:admin` role can access
- Non-admin users see "Access Denied" error
- Role checked on every page load (security)

### Admin Dashboard

**Key Metrics** (at a glance):
- Total users in system
- Active users (logged in recently)
- Pending KYC reviews
- Portal links configured
- Recent admin actions

**Quick Actions**:
- Invite new user
- Review KYC queue
- Manage portal links
- View activity logs

**Navigation Tabs**:
- Users
- KYC Review
- Pricing (if enabled)
- Portal Links
- Settings

---

## User Management

### Viewing Users

**Navigate**: Admin Panel → Users

**User List** shows:
- Name and email
- Role (Admin, Member, etc.)
- Status (Active, Inactive, Pending)
- Last login
- Created date

**Filters**:
- By role
- By status
- By activity (active last 30 days)

**Sort**:
- By name (A-Z or Z-A)
- By last login (recent first or oldest first)
- By created date

---

### Inviting New Users

1. Click **"Invite User"** button
2. Fill in **User Details**:
   - **Email** (required): User's work email
   - **First Name** (required)
   - **Last Name** (required)
   - **Role** (required):
     - **Admin**: Full system access
     - **Member**: Standard staff access
   - **Custom Message** (optional): Personalized note in invitation email
3. Click **"Send Invitation"**

**What happens next**:
- Invitation created in database
- Email sent to user with unique invitation link
- Invitation status: "Pending"
- Link expires in 7 days

**Invitation Statuses**:
- **Pending**: Sent but not accepted
- **Accepted**: User created account
- **Expired**: 7 days passed, link no longer valid
- **Cancelled**: You cancelled before user accepted

**Managing Invitations**:
- **Resend**: Click "Resend" to send new email with fresh link
- **Cancel**: Click "Cancel" to revoke invitation
- **Expired invitations**: Create new invitation (old link won't work)

---

### Managing User Roles

**Changing a User's Role**:
1. Navigate to Users list
2. Click user row to view details
3. Click **"Edit User"**
4. Select new **Role** from dropdown:
   - **Admin**: Full access including admin panel
   - **Member**: Standard access (no admin panel)
5. Click **"Save Changes"**

**Role takes effect**:
- Immediately for new sessions
- User must log out and back in to see changes
- Or wait for session to refresh (up to 7 days)

**Best Practice**:
- Grant admin role sparingly (principle of least privilege)
- Review admin roles quarterly
- Revoke admin when user changes role in organization
- Document reason for admin access in notes

---

### Deactivating Users

**When to Deactivate**:
- User leaves the company
- User on extended leave
- Security concern
- Account compromise suspected

**How to Deactivate**:
1. Navigate to Users → [User]
2. Click **"Deactivate User"**
3. Confirm action
4. User status → "Inactive"

**Effects of Deactivation**:
- ❌ User cannot log in
- ❌ All sessions terminated immediately
- ❌ User removed from assignment lists
- ✅ User's historical data preserved (activity logs, time entries, etc.)
- ✅ Can be reactivated later

**Reactivating Users**:
1. Navigate to Users → Filter: "Inactive"
2. Click user row
3. Click **"Reactivate User"**
4. User can log in again with existing password

**Note**: Deactivation is reversible. For permanent removal, contact development team (requires data deletion process for GDPR compliance).

---

### Resetting User Passwords

**User Requested Reset**:
- User clicks "Forgot Password" on login page
- System sends reset link automatically
- No admin action required

**Admin-Initiated Reset**:
1. Navigate to Users → [User]
2. Click **"Reset Password"**
3. Select option:
   - **Send Reset Link**: Email sent to user, they set new password
   - **Set Temporary Password**: You set password, user must change on next login
4. If temporary password: Enter password, click "Set Password"
5. Notify user of their temporary password securely (not via email)

**Security Best Practices**:
- Always use "Send Reset Link" unless emergency
- Never send passwords via email
- Use secure channel (phone, Slack, in person) for temporary passwords
- Require password change on next login

---

### Viewing User Activity

**User Activity Log**:
1. Navigate to Users → [User]
2. Click **"Activity"** tab
3. See all actions by this user:
   - Logins (successful and failed)
   - Client access
   - Task updates
   - Time entries
   - Invoice generation
   - Configuration changes (if admin)

**Audit Trail Uses**:
- Investigate security incidents
- Comply with audit requests
- Monitor productivity
- Identify training needs
- Resolve disputes ("Who changed this?")

**Export Activity**:
- Click **"Export to CSV"**
- Select date range
- Download for analysis or archival

---

## KYC/AML Review Queue

### Overview

**Purpose**: Manually review client verifications that couldn't be auto-approved.

**Legal Context**: As the accountancy firm, you are legally responsible for KYC/AML compliance under UK Money Laundering Regulations 2017.

**Review Frequency**:
- Check queue at least **daily**
- Ideally, review items within **4 business hours** of flagging
- Set up email notifications for new items

---

### Accessing Review Queue

**Navigate**: Admin Panel → KYC Review

**Queue shows**:
- Client name
- Verification date
- Flagging reason (document, facematch, liveness, AML)
- Severity (requires action, informational)
- Days pending (aging)

**Filters**:
- By flagging reason
- By severity
- By date range
- By assigned reviewer (if multiple admins)

**Sort**:
- By date (oldest first - recommended)
- By severity
- By client name

---

### Reviewing a Verification

Click **"Review"** on an item to see detailed report:

#### 1. Client Information

- Full name
- Date of birth
- Email address
- Phone number
- Business/company details

**Verify**:
- ✅ Information matches ID document
- ✅ No obvious red flags

#### 2. Document Verification

**Document Type**: Passport or Driving Licence

**Verification Results**:
- **Status**: Passed ✅ or Failed ❌
- **Document Number**: Extracted number
- **Expiry Date**: Valid or expired
- **Genuine Check**: Real document vs counterfeit
- **MRZ Check** (passport): Machine-readable zone validation
- **Chip Check** (passport): Electronic chip validation (if available)

**What to Check**:
- ✅ Document appears genuine in uploaded photos
- ✅ Not expired (or expired within last 3 months for passport)
- ✅ All details clearly visible
- ✅ No signs of tampering

**Red Flags**:
- ❌ Photos are blurry or obscured
- ❌ Document appears damaged or altered
- ❌ Expiry date long past
- ❌ Name doesn't match other information

---

#### 3. Biometric Verification

**Facematch**:
- **Score**: 0-100 (higher = better match)
- **Result**: Pass (>80) or Fail (<80)
- **ID Photo**: Photo from document
- **Live Photo**: Selfie taken during verification

**What to Check**:
- ✅ Both photos show same person
- ✅ Reasonable similarity (account for aging, hair changes, etc.)
- ✅ No obvious attempt to deceive

**Common Low Scores** (not necessarily fraud):
- Old ID photo (issued 10+ years ago)
- Significant weight change
- Different hairstyle or facial hair
- Poor selfie lighting

**Liveness Detection**:
- **Score**: 0-100
- **Result**: Pass (>80) or Fail (<80)
- **Check**: Ensures real person, not photo/video

**What to Check**:
- ✅ Liveness check completed (score shown)
- ✅ No obvious fraud attempt

**Low Liveness Scores**:
- Poor lighting during selfie
- Camera issues
- Movement during capture

---

#### 4. AML Screening Results

**PEP (Politically Exposed Person)**:
- **Match**: Yes ❌ or No ✅
- **Details**: If match, shows name, position, country

**Sanctions**:
- **Match**: Yes ❌ or No ✅
- **Lists**: UK HMT, UN, EU, US OFAC

**Watchlists**:
- **Match**: Yes ❌ or No ✅
- **Source**: Law enforcement, Interpol, etc.

**Adverse Media**:
- **Match**: Yes ❌ or No ✅
- **Summary**: Financial crime news mentions

**What to Check**:

**For PEP Matches**:
- ✅ Confirm it's actually the same person (not just similar name)
- ✅ If confirmed PEP:
  - Acceptable if lower-risk (e.g., local councillor)
  - Requires enhanced due diligence if high-risk (e.g., MP, senior official)
  - Document decision in notes

**For Sanctions Matches**:
- ✅ Verify it's the same person (not false positive)
- ❌ If confirmed sanctions match: **Do not proceed** - rejection required by law
- ✅ If false positive (common with similar names): Approve with note

**For Watchlist Matches**:
- ✅ Investigate: Are they actually the person on watchlist?
- ✅ Consider: What is watchlist for? (some are low risk)
- ✅ Document: Why you decided to approve/reject

**For Adverse Media**:
- ✅ Review articles: What is the allegation?
- ✅ Assess risk: Is it relevant to financial crime?
- ✅ Consider: Resolved or ongoing?
- ✅ Document decision

---

#### 5. Questionnaire Responses

Review client's answers to onboarding questionnaire:

**Personal Information**:
- Name, address, date of birth
- Verify matches ID document

**Business Information**:
- Company details, directors, beneficial owners
- Cross-check with Companies House if UK company

**Source of Funds**:
- Where does their money come from?
- **Red flags**:
  - ❌ Vague answers ("business")
  - ❌ No legitimate income source
  - ❌ Inconsistent with business type
  - ❌ High-risk sources (gambling, crypto with no explanation)

**Beneficial Ownership**:
- Who owns/controls the business?
- Verify matches Companies House PSC register (for UK companies)
- **Red flags**:
  - ❌ Complex ownership structures (without good reason)
  - ❌ Offshore ownership (not illegal but higher risk)
  - ❌ Nominee directors/shareholders (without disclosure)

---

### Making a Decision

After reviewing all information, you have three options:

#### Option 1: Approve ✅

**When to approve**:
- ✅ All checks passed or have reasonable explanations
- ✅ Any flagged items have been investigated and resolved
- ✅ You're satisfied client is legitimate
- ✅ No significant money laundering risk

**How to approve**:
1. Review all sections thoroughly
2. Click **"Approve Onboarding"** button
3. Add **approval note** (optional but recommended):
   - Why you approved despite flagging
   - What additional checks you did
   - Any conditions or monitoring requirements
4. Click **"Confirm Approval"**

**What happens**:
- Client status → "Active"
- Client portal access granted
- Approval email sent to client
- Your approval logged in audit trail (with your user ID and timestamp)

**Best Practice**:
- Always add approval notes for flagged items
- Document your decision-making
- This protects you and the firm in audits

---

#### Option 2: Request More Information ℹ️

**When to request info**:
- ⚠️ Need clarification on questionnaire answers
- ⚠️ Source of funds unclear
- ⚠️ Beneficial ownership structure complex
- ⚠️ AML match needs investigation
- ⚠️ Document quality poor but fixable

**How to request**:
1. Click **"Request Information"** button
2. Enter **specific questions** for client:
   - Be clear and specific ("Please provide evidence of employment income")
   - List all items you need ("Upload: payslip, bank statement, etc.")
   - Explain why you need it ("To verify source of funds")
3. Select **deadline** (typically 7 days)
4. Click **"Send Request"**

**What happens**:
- Email sent to client with your questions
- Client receives link to upload additional documents
- Verification status → "Pending Information"
- You receive notification when client responds
- Review continues when information received

**Follow-up**:
- If client doesn't respond within deadline, send reminder
- After second reminder, consider rejection if no response

---

#### Option 3: Reject ❌

**When to reject**:
- ❌ Confirmed sanctions match (required by law)
- ❌ Unable to verify identity (fraudulent documents suspected)
- ❌ Client uncooperative (won't provide required information)
- ❌ High money laundering risk without adequate mitigation
- ❌ Beneficial ownership cannot be determined

**How to reject**:
1. Click **"Reject Onboarding"** button
2. Select **rejection reason** from dropdown:
   - Document verification failed
   - Identity cannot be verified
   - AML screening failed
   - Inadequate information provided
   - Client unresponsive
   - Other (specify)
3. Enter **detailed explanation** (client will see this):
   - Be professional and clear
   - Don't make accusations
   - Explain what was insufficient
   - Offer re-verification if appropriate
4. Select **re-verification option**:
   - Allow re-verification (client can try again with better info)
   - Do not allow re-verification (final rejection)
5. Click **"Confirm Rejection"**

**What happens**:
- Client status remains "Onboarding" (if re-verification allowed) or → "Rejected"
- Rejection email sent to client (with your explanation)
- Portal access remains blocked
- If re-verification allowed, client receives link to restart process
- Your rejection logged in audit trail

**Legal Note**:
- You must reject if confirmed sanctions match (failure to do so is illegal)
- Document reasons clearly (for regulatory audits)
- Consult firm's MLRO (Money Laundering Reporting Officer) for complex cases

---

### Re-Verification Process

**When client re-verifies**:
1. New verification session created
2. Client uploads new/better documents
3. Client updates questionnaire (pre-filled with previous answers)
4. New LEM Verify check runs
5. New item appears in your KYC queue
6. You review again (may auto-approve if all checks pass)

**Reviewing Re-Verification**:
- Check if issues from first attempt are resolved
- Note: It's marked as "Re-verification - Attempt 2" (or 3, 4, etc.)
- View history of previous attempts
- Compare old vs new information

**Limits**:
- Client can re-verify up to 5 times (prevents system abuse)
- After 5 attempts, manual override required (contact development team)

---

### Best Practices for KYC Review

**Daily Routine**:
1. Check queue first thing in morning
2. Review oldest items first (avoid backlogs)
3. Aim for same-day review (4-hour SLA ideal)
4. Clear simple cases first, save complex for focused time

**Documentation**:
- Always add notes to approvals (especially if flagged)
- Be specific in rejection reasons
- Document any additional checks you performed
- Save copies of additional evidence provided

**Risk-Based Approach**:
- **Low Risk**: Individual sole traders, small local businesses
  - Can be more lenient on minor issues
  - Quick approvals appropriate
- **Medium Risk**: Companies, higher turnover, complex structures
  - More thorough review required
  - May need additional information
- **High Risk**: Cash businesses, offshore connections, PEP, complex ownership
  - Enhanced due diligence required
  - Senior review or MLRO involvement
  - Detailed documentation essential

**Escalation**:
- **Uncertain cases**: Discuss with colleagues or MLRO
- **Complex structures**: Request accountant review
- **Sanctions matches**: Immediately escalate to MLRO
- **Suspected fraud**: Do not approve, escalate to MLRO

**Quality Assurance**:
- Peer review of complex decisions (if possible)
- MLRO spot-checks of approvals (random sample)
- Annual review of all flagged approvals (audit compliance)

---

## Pricing Configuration

### Overview

**Purpose**: Manage the pricing calculator used for proposal generation.

**Access**: Admin Panel → Pricing (if enabled)

**Components**:
- Service Components (28 services)
- Pricing Rules (138+ rules)
- Configuration (multipliers, discounts)

**Warning**: Changes affect all new proposals immediately. Test thoroughly before saving.

---

### Service Components

**Navigate**: Admin Panel → Pricing → Service Components

#### Viewing Services

**Services are organized by category**:
- Compliance (Annual Accounts, Tax Returns, etc.)
- VAT (VAT Returns, Registration, etc.)
- Bookkeeping (Transaction Processing, Bank Reconciliation, etc.)
- Payroll (Payroll Processing, RTI, etc.)
- Management (Management Accounts, Forecasting, etc.)
- Secretarial (Company Secretarial, Confirmation Statements, etc.)
- Tax Planning (Tax Planning, Advisory, etc.)
- Add-ons (One-off services)

**Each service shows**:
- Service name and code
- Category
- Pricing model (Turnover, Transaction, Both, Fixed)
- Base price (if fixed)
- Active status

**Filters**:
- By category
- By active/inactive
- By pricing model

**Search**:
- Search by name or code

---

#### Adding a Service Component

1. Click **"Add Service"** button
2. Fill in **Basic Information**:
   - **Code** (required): Unique identifier (e.g., "BOOK_BASIC")
   - **Name** (required): Display name (e.g., "Basic Bookkeeping")
   - **Category** (required): Select from dropdown
   - **Description** (optional): Detailed description
3. Configure **Pricing**:
   - **Pricing Model**:
     - **Turnover**: Price based on annual turnover bands
     - **Transaction**: Price based on monthly transaction volume
     - **Both**: Price based on both turnover AND transactions
     - **Fixed**: Single fixed price
   - **Base Price** (if Fixed model): Enter amount
   - **Supports Complexity**: Check if service has complexity multipliers
4. Set **Status**:
   - **Active**: Visible in calculator
   - **Inactive**: Hidden (for discontinued services)
5. Click **"Save Service"**

**What happens next**:
- Service appears in calculator
- You must add pricing rules for Turnover/Transaction/Both models
- Activity logged

---

#### Editing a Service Component

1. Click service row in list
2. Edit fields
3. Click **"Save Changes"**

**Warning**: Editing affects all new proposals. Existing proposals use snapshot data.

#### Deleting a Service Component

1. Click service row
2. Click **"Delete Service"**
3. Confirm deletion

**Constraints**:
- Cannot delete if pricing rules exist (delete rules first)
- Cannot delete if used in active proposals
- Can mark as Inactive instead (preserves historical data)

---

### Pricing Rules

**Navigate**: Admin Panel → Pricing → Pricing Rules

#### Understanding Pricing Rules

**Rules define prices for service components based on bands**:

**Turnover Bands** (example):
- £0 - £50,000: £50/month
- £50,001 - £100,000: £75/month
- £100,001 - £250,000: £100/month
- £250,001 - £500,000: £150/month
- etc.

**Transaction Bands** (example):
- 0 - 50 transactions/month: £30/month
- 51 - 100 transactions/month: £50/month
- 101 - 200 transactions/month: £75/month
- etc.

**Complexity Levels** (if service supports):
- Clean: Base price (1.0x multiplier)
- Average: 1.2x multiplier
- Complex: 1.5x multiplier
- Disaster: 2.0x multiplier

---

#### Viewing Pricing Rules

**List shows**:
- Service component
- Rule type (Turnover Band, Transaction Band, etc.)
- Min value - Max value
- Price
- Complexity level (if applicable)
- Active status

**Filters**:
- By service component
- By rule type
- By active/inactive

**Sort**:
- By service (alphabetical)
- By min value (ascending)

---

#### Adding a Pricing Rule

1. Click **"Add Rule"** button
2. Select **Service Component**
3. Select **Rule Type**:
   - Turnover Band
   - Transaction Band
   - Employee Band (for payroll)
   - Per Unit (per item pricing)
   - Fixed (single price)
4. Enter **Range** (for band rules):
   - **Min Value**: Band start (inclusive)
   - **Max Value**: Band end (inclusive)
   - Use `null` or `999999999` for unlimited upper bound
5. Enter **Price**: Amount for this band
6. Select **Complexity Level** (if applicable):
   - Leave blank for base pricing
   - Or select: Clean, Average, Complex, Disaster
7. Click **"Save Rule"**

**Validation**:
- System checks for overlapping bands (prevents conflicts)
- System ensures no gaps (warns if price jumps expected)

**Example: Bookkeeping Turnover Bands**:
```
Rule 1: £0 - £50,000 = £50/month
Rule 2: £50,001 - £100,000 = £75/month
Rule 3: £100,001 - £250,000 = £100/month
Rule 4: £250,001 - £500,000 = £150/month
Rule 5: £500,001 - £1,000,000 = £200/month
Rule 6: £1,000,001 - ∞ = £300/month
```

---

#### Editing Pricing Rules

1. Click rule row
2. Edit fields (be careful with ranges - may affect other rules)
3. Click **"Save Changes"**

**System validates**:
- No overlaps with other rules for same service
- Min < Max
- Price > 0

#### Deleting Pricing Rules

1. Click rule row
2. Click **"Delete Rule"**
3. Confirm deletion

**Warning**: Deleting a rule creates a gap in pricing. Ensure another rule covers that range, or proposals in that band will fail.

---

### Configuration

**Navigate**: Admin Panel → Pricing → Configuration

#### Complexity Multipliers

**Model A** (Recommended):
- Clean: 1.0x (default)
- Average: 1.2x
- Complex: 1.5x
- Disaster: 2.0x

**Model B** (Alternative):
- Clean: 1.0x (default)
- Average: 1.3x
- Complex: 1.6x
- Disaster: 2.2x

**Editing Multipliers**:
1. Enter new multiplier values (e.g., 1.25 for 25% increase)
2. Click **"Save Multipliers"**
3. Changes affect all new proposals immediately

**Best Practice**: Only adjust if pricing consistently off. Small changes (0.1-0.2) are usually sufficient.

---

#### Industry Multipliers

**Adjust pricing for specific industries**:

**High-risk/complex industries** (higher multiplier):
- Construction: 1.2x
- Hospitality: 1.15x
- Healthcare: 1.25x

**Standard industries** (1.0x):
- Professional Services: 1.0x
- Retail: 1.0x
- Technology: 1.0x

**Editing Industry Multipliers**:
1. Select industry from dropdown
2. Enter multiplier
3. Click **"Add Industry Multiplier"**
4. To edit: Click industry row, change value, save
5. To delete: Click industry row, click "Delete"

---

#### Discount Rules

**Volume Discount**:
- Percentage discount for multiple services
- Example: 5% off if client selects 3+ services, 10% off for 5+ services

**Rush Job Premium**:
- Percentage premium for quick turnaround
- Example: +20% for completion within 1 week

**New Client Discount**:
- Percentage discount to attract new clients
- Example: 10% off first year

**Editing Discounts**:
1. Enter discount percentages (positive number, e.g., 10 for 10%)
2. Enter thresholds (e.g., minimum 3 services for volume discount)
3. Click **"Save Discounts"**

**Authorization**:
- Some firms restrict discount configuration to senior management
- May require approval workflow (not currently implemented)

---

#### Export/Import Configuration

**Export Configuration**:
1. Click **"Export Configuration"**
2. JSON file downloads containing:
   - All service components
   - All pricing rules
   - All multipliers and discounts
3. Save as backup or for migration

**Import Configuration**:
1. Click **"Import Configuration"**
2. Select JSON file (previously exported)
3. Review changes (shows additions, modifications, deletions)
4. Click **"Confirm Import"**
5. Configuration replaced

**Use Cases**:
- Backup before major changes
- Migrate pricing to new tenant
- Annual pricing review (export, review offline, re-import)

**Warning**: Import replaces ALL pricing data. Always export current config first as backup.

---

#### Reset to Defaults

**If you need to start over**:
1. Click **"Reset to Defaults"**
2. Confirm (this cannot be undone without backup)
3. System loads default pricing from `scripts/seed.ts`

**What gets reset**:
- All service components → default 28 services
- All pricing rules → default 138+ rules
- All multipliers → default values
- All discounts → default values

**What is preserved**:
- Existing proposals (use snapshot data)
- Historical calculations

**Best Practice**: Export configuration before resetting, in case you need to restore.

---

## Portal Links Management

### Overview

**Purpose**: Manage quick-access links to internal and external tools.

**Users see these**: Practice Hub → Portal (or sidebar icon)

**Common links**:
- HMRC Gateway
- Companies House
- Xero
- Slack
- Google Workspace

---

### Accessing Portal Management

**Navigate**: Admin Panel → Portal Links

**Two sections**:
1. **Categories**: Organize links into groups
2. **Links**: Individual links within categories

---

### Managing Categories

#### Viewing Categories

**List shows**:
- Category name
- Icon (Lucide icon name)
- Color (hex code)
- Number of links in category
- Sort order
- Active status

**Sort**:
- By sort order (default)
- By name

#### Adding a Category

1. Click **"Add Category"**
2. Fill in **Details**:
   - **Name** (required): Display name (e.g., "Client Tools")
   - **Description** (optional): Brief description
   - **Icon Name** (optional): Lucide icon name (e.g., "FileText", "Users", "Settings")
     - Browse: https://lucide.dev/icons
   - **Color** (optional): Hex color code (e.g., "#3B82F6" for blue)
   - **Sort Order**: Number (lower = appears first, e.g., 10, 20, 30)
3. Set **Active** status
4. Click **"Save Category"**

**What happens**:
- Category appears in portal navigation
- Users can click to view links in this category

#### Editing a Category

1. Click category row
2. Edit fields
3. Click **"Save Changes"**

**Changes take effect**:
- Immediately for all users
- No logout required

#### Deleting a Category

1. Click category row
2. Click **"Delete Category"**
3. Confirm deletion

**Constraints**:
- Cannot delete if links exist in category (delete or reassign links first)
- Can mark as Inactive instead (hides from users)

---

### Managing Links

#### Viewing Links

**List shows**:
- Title
- URL
- Category
- Icon
- Sort order
- Active status
- Internal/External flag

**Filters**:
- By category
- By active/inactive
- By internal/external

**Search**:
- Search by title or URL

---

#### Adding a Link

1. Click **"Add Link"**
2. Fill in **Link Details**:
   - **Title** (required): Display name (e.g., "HMRC Gateway")
   - **Description** (optional): Brief description shown on hover
   - **URL** (required): Full URL (e.g., "https://www.gov.uk/log-in-register-hmrc-online-services")
   - **Category** (required): Select from dropdown
   - **Icon Name** (optional): Lucide icon (e.g., "ExternalLink", "FileText")
   - **Sort Order**: Number (within category, lower = appears first)
3. Configure **Access**:
   - **Is Internal**: Check if link is to Practice Hub page (e.g., "/admin", "/practice-hub")
   - **Target Blank**: Check to open in new tab (default for external links)
   - **Requires Auth**: Check if users must be logged in to access
   - **Allowed Roles** (optional): Select roles that can see this link (empty = all roles)
4. Set **Active** status
5. Click **"Save Link"**

**What happens**:
- Link appears in portal under selected category
- Visible to users with allowed roles (or all users if no role restriction)

**Examples**:

**External Link**:
```
Title: HMRC Gateway
URL: https://www.gov.uk/log-in-register-hmrc-online-services
Category: Client Tools
Icon: ExternalLink
Is Internal: No
Target Blank: Yes
Requires Auth: Yes
Allowed Roles: (all)
```

**Internal Link**:
```
Title: Admin Panel
URL: /admin
Category: Practice Hub
Icon: Settings
Is Internal: Yes
Target Blank: No
Requires Auth: Yes
Allowed Roles: Admin
```

---

#### Editing a Link

1. Click link row
2. Edit fields
3. Click **"Save Changes"**

**Common edits**:
- Update URL (when service moves)
- Change category (reorganize)
- Update allowed roles (restrict access)

#### Deleting a Link

1. Click link row
2. Click **"Delete Link"**
3. Confirm deletion

**Note**: Cannot recover user favorites after deletion. Consider marking inactive instead.

---

### Organizing Portal Links

**Best Practices**:

**Category Organization**:
- Group by purpose (Client Tools, Team Tools, Resources)
- Or by provider (Google, Microsoft, HMRC)
- Keep categories to 5-8 max (avoid overwhelming users)

**Sort Order**:
- Most-used links first (lower numbers)
- Use increments of 10 (10, 20, 30) to allow insertion later
- Alphabetical within category if no usage data

**Link Titles**:
- Short and descriptive (2-4 words)
- Consistent naming (always "HMRC Gateway", not sometimes "Gateway")
- Avoid jargon

**Role Restrictions**:
- Only restrict if truly necessary (principle of least restriction)
- Common restrictions:
  - Admin panel → Admins only
  - Payroll systems → Payroll team only
  - Client-facing links → All roles

---

## Client Portal Management

### Overview

**Purpose**: Manage client access to the client portal.

**Client Portal**: Separate interface where clients can:
- View their onboarding status
- Upload documents
- Complete questionnaires
- View proposals
- Access resources

---

### Client Portal Invitations

**Navigate**: Admin Panel → Client Portal → Invitations

#### Inviting Clients to Portal

**Automatic Invitation**:
- When client onboarding is approved, invitation sent automatically
- Client receives email with portal link and setup instructions

**Manual Invitation**:
1. Click **"Invite Client"**
2. Enter **Client Email**
3. Select **Client** from dropdown (links invitation to client record)
4. Select **Access Level**:
   - **Viewer**: Read-only access
   - **Editor**: Can upload documents, complete forms
   - **Admin**: Full access (rare for external clients)
5. Add **Custom Message** (optional)
6. Click **"Send Invitation"**

**What happens**:
- Invitation created
- Email sent with secure link
- Link expires in 7 days
- Client creates portal account

**Invitation Statuses**:
- **Pending**: Sent, not yet accepted
- **Accepted**: Client created account
- **Expired**: 7 days passed
- **Revoked**: You cancelled invitation

---

#### Managing Portal Access

**View Client Access**:
1. Navigate to Client Portal → Access
2. See all clients with portal access
3. Filter by client, access level, active status

**Revoke Access**:
1. Click client row
2. Click **"Revoke Access"**
3. Confirm
4. Client can no longer log in to portal

**Temporarily Suspend Access**:
1. Click client row
2. Click **"Suspend Access"**
3. Client cannot log in until you reactivate
4. To reactivate: Click "Reactivate Access"

**Change Access Level**:
1. Click client row
2. Change **Access Level** dropdown
3. Click **"Save Changes"**

**Use Cases for Access Management**:
- Revoke when client relationship ends
- Suspend if client is dormant or payment overdue
- Change to Viewer if client should only review (not edit)

---

## System Settings

### Overview

**Navigate**: Admin Panel → Settings

**Available Settings** (may vary by deployment):

---

### General Settings

**Organization Information**:
- Organization name
- Primary contact email
- Support email
- Phone number
- Address

**Editing**:
1. Navigate to Settings → General
2. Edit fields
3. Click **"Save Settings"**

**These appear in**:
- Email footers
- Proposal PDFs
- Client portal branding

---

### Email Settings

**Email Provider**: Resend (configured via environment variables)

**From Address**:
- Default: `noreply@innspiredaccountancy.com`
- Editable if you have verified custom domain in Resend

**Team Email**:
- Where internal notifications are sent
- Default: `team@innspiredaccountancy.com`

**Email Templates** (advanced):
- Invitation emails
- KYC approval/rejection emails
- Proposal emails
- Password reset emails

**Note**: Template editing requires development skills (HTML/CSS). Contact developer for customization.

---

### Security Settings

**Session Timeout**:
- Default: 7 days
- Recommendation: 1-7 days for balance of security and convenience

**Password Requirements**:
- Minimum length (default: 8 characters)
- Require numbers (default: yes)
- Require uppercase (default: no)
- Require special characters (default: no)

**Two-Factor Authentication** (if enabled):
- Require for admins
- Optional for members
- Authenticator app (Google Authenticator, Authy, etc.)

**Failed Login Attempts**:
- Lockout after N failed attempts (default: 5)
- Lockout duration (default: 15 minutes)

**Editing**:
1. Navigate to Settings → Security
2. Adjust values
3. Click **"Save Settings"**
4. Changes apply to new sessions

---

### Backup Settings

**Automated Backups** (if configured):
- Database backup schedule (daily, weekly)
- Backup retention period (30 days default)
- Backup storage location (S3, local, etc.)

**Manual Backup**:
1. Navigate to Settings → Backups
2. Click **"Create Backup Now"**
3. Backup job starts (may take several minutes)
4. Download link provided when complete

**Restore from Backup**:
- Contact developer/system administrator
- Requires database access
- Downtime required (plan accordingly)

**Best Practice**:
- Test restore quarterly (ensure backups work)
- Download monthly backup locally (offline copy)
- Document backup procedures

---

## Security & Permissions

### Role-Based Access Control

**Current Roles**:
- **Admin**: Full system access
- **Member**: Standard staff access

**Future Enhancement**: Granular permissions per module (clients, tasks, invoices, etc.)

---

### Admin Security Responsibilities

**Protecting Your Account**:
- ✅ Use strong password (12+ characters, mix of types)
- ✅ Enable 2FA if available
- ✅ Never share credentials
- ✅ Log out on shared computers
- ✅ Report suspicious activity immediately

**Monitoring Access**:
- ✅ Review user list monthly
- ✅ Deactivate departed users immediately
- ✅ Review admin list quarterly (remove unnecessary admin rights)
- ✅ Check activity logs for unusual patterns

**Incident Response**:
1. **Suspected account compromise**:
   - Reset user password immediately
   - Review user's recent activity
   - Check for unauthorized changes
   - Document incident
   - Notify senior management if data accessed
2. **Unauthorized access attempt**:
   - Review failed login logs
   - Contact user to verify it was them
   - If not them: reset password, enable 2FA
   - Consider temporary account lock
3. **Data breach**:
   - Do not delete evidence
   - Notify senior management immediately
   - Contact developer for forensic analysis
   - Follow firm's incident response plan
   - May require notification to ICO (UK GDPR)

---

## Monitoring & Reports

### Activity Logs

**Navigate**: Admin Panel → Activity Logs

**What's Logged**:
- User logins (successful and failed)
- Client creation/modification
- Task updates
- Invoice generation
- Configuration changes
- KYC approvals/rejections
- Portal access changes

**Filtering**:
- By user
- By entity type (client, task, invoice, etc.)
- By action (created, updated, deleted, etc.)
- By date range

**Exporting**:
- Click **"Export Logs"**
- Select date range
- Download CSV for analysis

**Retention**:
- Activity logs retained for 7 years (compliance requirement)
- Older logs archived to cold storage

---

### System Health Dashboard

**Navigate**: Admin Panel → System Health (if available)

**Metrics**:
- Active users (last 24 hours)
- Database size
- Storage usage
- API response times
- Error rate (last 24 hours)

**Alerts** (if configured):
- High error rate
- Slow response times
- Storage nearly full
- Database connection issues

**Action Items**:
- Review error logs if error rate high
- Contact developer if performance degraded
- Plan storage upgrade if usage high

---

### Usage Reports

**Available Reports**:
- User activity (logins, time spent)
- Feature usage (which modules used most)
- KYC review metrics (approval rate, average time)
- Proposal generation trends
- Client growth over time

**Generating Reports**:
1. Navigate to Admin Panel → Reports
2. Select report type
3. Select date range
4. Click **"Generate Report"**
5. View online or download as CSV/PDF

**Use Cases**:
- Identify training needs (low feature usage)
- Capacity planning (user growth trends)
- Process improvement (KYC review bottlenecks)
- Billing/chargeback (usage per department)

---

## Troubleshooting

### Common Issues

#### User Cannot Log In

**Symptoms**: User reports "invalid email or password"

**Troubleshooting**:
1. Verify user is active (not deactivated)
2. Check email is correct (typos common)
3. Check caps lock (passwords are case-sensitive)
4. Try password reset
5. Check for account lockout (too many failed attempts)
   - If locked: Navigate to Users → [User] → Click "Unlock Account"
6. Check session timeout settings (may be too short)

**Resolution**:
- Reset password OR unlock account OR verify email

---

#### KYC Verification Stuck

**Symptoms**: Client reports "verification in progress" for hours

**Troubleshooting**:
1. Check KYC review queue for the client
2. Review LEM Verify webhook logs (developer access required)
3. Check client's verification record in database:
   - Navigate to Admin Panel → Clients → [Client] → Onboarding
   - View verification status
4. If webhook failed:
   - Manually trigger re-check (developer required)
   - Or request client re-verify

**Resolution**:
- Wait for webhook retry (automatic)
- OR manual intervention if webhook issue

---

#### Portal Links Not Appearing

**Symptoms**: User reports missing links in portal

**Troubleshooting**:
1. Check link is Active
2. Check user's role matches Allowed Roles for link
3. Check category is Active
4. Check user has refreshed page (cache issue)
5. Check browser console for JavaScript errors (developer tools, F12)

**Resolution**:
- Activate link/category OR adjust allowed roles OR clear cache

---

#### Pricing Calculator Error

**Symptoms**: "Cannot calculate price" error when creating proposal

**Troubleshooting**:
1. Check service component is Active
2. Check pricing rules exist for selected service
3. Check pricing rules cover the turnover/transaction band entered
4. Check for overlapping rules (validation may have failed)
5. Review browser console for detailed error

**Resolution**:
- Add missing pricing rules OR fix overlapping rules OR activate service component

---

### Getting Developer Help

**When to escalate**:
- Database errors
- Webhook failures
- Performance issues (slow page loads)
- Error messages mentioning "server error" or "500"
- Data corruption suspected

**Information to Provide**:
- What user was trying to do
- Error message (exact text)
- Screenshot of error
- User ID and timestamp
- Browser and OS (e.g., Chrome on Windows)
- Any recent system changes

**Contact**:
- Email: dev@innspiredaccountancy.com
- Slack: #dev-support (if available)
- Phone: (for urgent production issues only)

---

## Best Practices

### Daily Admin Tasks

**Morning** (10-15 minutes):
- [ ] Check KYC review queue
- [ ] Review any overnight alerts (if configured)
- [ ] Check user access requests (if any)
- [ ] Review activity log for anomalies

**Afternoon** (5 minutes):
- [ ] Check KYC queue again
- [ ] Respond to any user access issues

**End of Day** (5 minutes):
- [ ] Ensure KYC queue is clear (or items in progress)
- [ ] Review any configuration changes made today

---

### Weekly Admin Tasks

**Monday** (30 minutes):
- [ ] Review user list (any deactivations needed?)
- [ ] Check for inactive users (haven't logged in 30+ days)
- [ ] Review failed login attempts (security check)

**Friday** (20 minutes):
- [ ] Export activity logs for the week (archive)
- [ ] Review system health metrics
- [ ] Plan any configuration changes for next week

---

### Monthly Admin Tasks

**First of Month** (1 hour):
- [ ] Review all active users (verify still employed)
- [ ] Review admin role assignments (still appropriate?)
- [ ] Export monthly activity logs (compliance)
- [ ] Review KYC approval/rejection rates (quality check)
- [ ] Update portal links (any broken links?)

**Mid-Month** (30 minutes):
- [ ] Test backup restore (ensure backups working)
- [ ] Review pricing configuration (any adjustments needed?)
- [ ] Check for system updates (coordinate with developer)

---

### Quarterly Admin Tasks

**Every 3 Months** (2-3 hours):
- [ ] Comprehensive user audit (remove unnecessary access)
- [ ] Review all admin accounts (reduce if possible)
- [ ] Test disaster recovery plan (simulate failure)
- [ ] Review and update admin documentation
- [ ] Train new admins (if any)
- [ ] Review system logs for long-term trends
- [ ] Plan capacity upgrades (if needed)

---

### Annual Admin Tasks

**Once Per Year** (full day):
- [ ] Complete security audit (review all access, logs, permissions)
- [ ] Review and update all system settings
- [ ] Export full year of activity logs (7-year retention)
- [ ] Review pricing configuration (annual pricing review)
- [ ] Update documentation (this guide, user guides, etc.)
- [ ] Disaster recovery drill (full test of DR plan)
- [ ] Vendor review (LEM Verify, Resend, etc. - are they still best choice?)

---

### Security Best Practices

**Access Management**:
- Grant minimum necessary permissions
- Review permissions quarterly
- Deactivate users immediately upon departure
- Never share admin credentials

**Password Management**:
- Use password manager (LastPass, 1Password, etc.)
- Enable 2FA on admin accounts
- Never write down passwords
- Rotate admin passwords annually

**Data Protection**:
- Never email sensitive data unencrypted
- Use secure file sharing (client portal, not email attachments)
- Verify recipient before sharing data
- Follow GDPR guidelines for data processing

**Audit & Compliance**:
- Keep detailed notes of all KYC approvals/rejections
- Export activity logs monthly (backup)
- Document reasons for configuration changes
- Maintain audit trail for regulatory inspections

**Incident Prevention**:
- Stay vigilant for phishing emails
- Verify unusual requests (even if from known users)
- Report suspicious activity immediately
- Keep software updated (coordinate with developer)

---

## Additional Resources

### Training Materials

- **Staff User Guide**: [STAFF_GUIDE.md](/docs/user-guides/STAFF_GUIDE.md)
- **Client Onboarding Guide**: [CLIENT_ONBOARDING_GUIDE.md](/docs/user-guides/CLIENT_ONBOARDING_GUIDE.md)
- **FAQ**: [FAQ.md](/docs/user-guides/FAQ.md)

### Technical Documentation

- **API Reference**: [API_REFERENCE.md](/docs/API_REFERENCE.md)
- **Database Schema**: [DATABASE_SCHEMA.md](/docs/DATABASE_SCHEMA.md)
- **Environment Variables**: [ENVIRONMENT_VARIABLES.md](/docs/ENVIRONMENT_VARIABLES.md)

### Operations Documentation

- **Deployment Checklist**: [DEPLOYMENT_CHECKLIST.md](/docs/DEPLOYMENT_CHECKLIST.md)
- **Operational Runbooks**: [RUNBOOKS.md](/docs/operations/RUNBOOKS.md)
- **Monitoring Strategy**: [MONITORING.md](/docs/operations/MONITORING.md)
- **Backup & Recovery**: [BACKUP_RECOVERY.md](/docs/operations/BACKUP_RECOVERY.md)

### Support

- **Email**: support@innspiredaccountancy.com
- **Developer**: dev@innspiredaccountancy.com
- **Emergency**: (phone number for urgent production issues)

---

## Appendix: Admin Checklist for New Deployments

**Before going live** with Practice Hub, ensure:

**User Setup**:
- [ ] At least 2 admin users configured (redundancy)
- [ ] All staff users invited and activated
- [ ] User roles assigned correctly
- [ ] Test user accounts created for testing

**KYC Configuration**:
- [ ] LEM Verify API key configured (production)
- [ ] Webhook endpoint tested
- [ ] Webhook secret configured
- [ ] Google AI API key configured (for document extraction)
- [ ] Test onboarding flow end-to-end

**Pricing Configuration**:
- [ ] All service components configured
- [ ] All pricing rules configured and tested
- [ ] Complexity multipliers set
- [ ] Industry multipliers set (if using)
- [ ] Discount rules configured
- [ ] Test calculations for all services

**Portal Configuration**:
- [ ] Portal categories created
- [ ] Portal links added
- [ ] Links tested (no 404 errors)
- [ ] Role restrictions configured appropriately

**Email Configuration**:
- [ ] Email provider configured (Resend)
- [ ] From address verified
- [ ] Team email configured
- [ ] Test email delivery

**Client Portal**:
- [ ] Client portal enabled
- [ ] Invitation emails tested
- [ ] Client can access portal
- [ ] Client can complete onboarding

**Security**:
- [ ] Admin passwords strong and secure
- [ ] 2FA enabled (if available)
- [ ] Session timeout configured
- [ ] Password requirements set
- [ ] Failed login lockout enabled

**Monitoring**:
- [ ] Activity logging enabled
- [ ] Error logging configured (Sentry if using)
- [ ] Backup schedule configured
- [ ] Test backup restore

**Documentation**:
- [ ] Admin guide reviewed and customized
- [ ] Staff guide distributed
- [ ] Client onboarding guide reviewed
- [ ] Support contact information updated

**Training**:
- [ ] All admins trained on admin panel
- [ ] All staff trained on basic features
- [ ] KYC review process demonstrated
- [ ] Emergency procedures documented

**Go-Live**:
- [ ] Final testing complete
- [ ] Backup taken immediately before go-live
- [ ] Monitoring active
- [ ] Support team on standby
- [ ] Users notified of launch

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**For**: System Administrators
**Review Frequency**: Quarterly
