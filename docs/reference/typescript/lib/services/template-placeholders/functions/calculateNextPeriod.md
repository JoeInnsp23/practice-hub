[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/template-placeholders](../README.md) / calculateNextPeriod

# Function: calculateNextPeriod()

> **calculateNextPeriod**(`currentPeriodEndDate`, `frequency`): `Date`

Defined in: [lib/services/template-placeholders.ts:178](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/services/template-placeholders.ts#L178)

Calculate the next period's activation date after task completion
This is used to auto-generate the next recurring task

## Parameters

### currentPeriodEndDate

`Date`

### frequency

`"daily"` | `"weekly"` | `"monthly"` | `"quarterly"` | `"annually"`

## Returns

`Date`
