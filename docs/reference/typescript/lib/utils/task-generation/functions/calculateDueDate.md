[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/task-generation](../README.md) / calculateDueDate

# Function: calculateDueDate()

> **calculateDueDate**(`activationDate`, `offsetDays?`, `offsetMonths?`): `Date`

Defined in: [lib/utils/task-generation.ts:59](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/utils/task-generation.ts#L59)

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
