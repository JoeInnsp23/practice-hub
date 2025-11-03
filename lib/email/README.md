# Resend Email Integration

**Location**: `lib/email/`
**Type**: Integration Library
**Status**: Active

## Overview

Email delivery integration with Resend for transactional emails, notifications, and templates.

## Files

- `index.ts` - Resend client wrapper
- `send-client-portal-invitation.ts` - Client portal invitations
- `queue-processor.ts` - Email queue processing
- `template-renderer.ts` - Template rendering
- `leave-notifications.ts` - Leave request emails
- `timesheet-notifications.ts` - Timesheet emails
- `workflow-triggers.ts` - Workflow email automation

## Environment Variables

- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Default from address
- `RESEND_TEAM_EMAIL` - Team notification address
