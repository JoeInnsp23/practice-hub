[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/cron/expire-proposals](../README.md) / ExpireProposalsResult

# Interface: ExpireProposalsResult

Defined in: [lib/cron/expire-proposals.ts:30](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/cron/expire-proposals.ts#L30)

Proposal Expiration Cron Job - Core Logic

Purpose:
Automatically expire proposals when their validUntil date has passed.

What It Does:
1. Finds proposals where validUntil < now() AND status != 'expired'
2. Updates each proposal status to 'expired'
3. Creates activity log entry for audit trail
4. Sends team notification email

Idempotency:
- Safe to run multiple times
- Only processes proposals not already expired
- Activity logs won't duplicate (new entry per run)

Error Handling:
- Failures for individual proposals don't stop the batch
- All errors captured in Sentry with context
- Returns summary of successes and failures

## Properties

### errors

> **errors**: `string`[]

Defined in: [lib/cron/expire-proposals.ts:34](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/cron/expire-proposals.ts#L34)

***

### expiredCount

> **expiredCount**: `number`

Defined in: [lib/cron/expire-proposals.ts:32](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/cron/expire-proposals.ts#L32)

***

### processedCount

> **processedCount**: `number`

Defined in: [lib/cron/expire-proposals.ts:33](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/cron/expire-proposals.ts#L33)

***

### success

> **success**: `boolean`

Defined in: [lib/cron/expire-proposals.ts:31](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/cron/expire-proposals.ts#L31)
