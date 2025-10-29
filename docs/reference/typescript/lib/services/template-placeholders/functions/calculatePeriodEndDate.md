[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/template-placeholders](../README.md) / calculatePeriodEndDate

# Function: calculatePeriodEndDate()

> **calculatePeriodEndDate**(`activationDate`, `frequency`, `dayOfMonth?`): `Date`

Defined in: [lib/services/template-placeholders.ts:119](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/services/template-placeholders.ts#L119)

Calculate the period end date based on activation date and recurring frequency
For quarterly: End of the quarter (Mar 31, Jun 30, Sep 30, Dec 31)
For monthly: Last day of the month
For annually: End of the tax year (April 5th in UK)

## Parameters

### activationDate

`Date`

### frequency

`"daily"` | `"weekly"` | `"monthly"` | `"quarterly"` | `"annually"`

### dayOfMonth?

`number`

## Returns

`Date`
