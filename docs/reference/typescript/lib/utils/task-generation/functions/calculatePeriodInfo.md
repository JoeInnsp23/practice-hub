[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/task-generation](../README.md) / calculatePeriodInfo

# Function: calculatePeriodInfo()

> **calculatePeriodInfo**(`activationDate`, `periodOffset`, `frequency`): `object`

Defined in: [lib/utils/task-generation.ts:97](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/utils/task-generation.ts#L97)

Calculate period information for recurring tasks

## Parameters

### activationDate

`Date`

Base activation date

### periodOffset

`number`

Period offset (0 = current, 1 = next, etc.)

### frequency

Recurring frequency ('monthly' | 'quarterly' | 'annually')

`"monthly"` | `"quarterly"` | `"annually"`

## Returns

`object`

Period information (name, date)

### date

> **date**: `Date`

### period

> **period**: `string`
