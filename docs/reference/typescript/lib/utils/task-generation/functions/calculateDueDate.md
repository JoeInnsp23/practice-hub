[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/task-generation](../README.md) / calculateDueDate

# Function: calculateDueDate()

> **calculateDueDate**(`activationDate`, `offsetDays?`, `offsetMonths?`): `Date`

Defined in: [lib/utils/task-generation.ts:59](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/utils/task-generation.ts#L59)

Calculate due date by adding offset months and days to activation date

## Parameters

### activationDate

`Date`

Base date to calculate from (service activation or task generation date)

### offsetDays?

`number`

Number of days to add (can be negative)

### offsetMonths?

`number`

Number of months to add (can be negative)

## Returns

`Date`

Calculated due date
