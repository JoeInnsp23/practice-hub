[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/sales-stage-automation](../README.md) / getAutoSalesStage

# Function: getAutoSalesStage()

> **getAutoSalesStage**(`newStatus`, `currentStage`): `SalesStage` \| `null`

Defined in: [lib/utils/sales-stage-automation.ts:28](https://github.com/JoeInnsp23/practice-hub/blob/c04a58b0b0fade7601286d40714502e52afe6cf4/lib/utils/sales-stage-automation.ts#L28)

Determines if sales stage should be auto-updated based on status change

## Parameters

### newStatus

`ProposalStatus`

The new proposal status

### currentStage

`SalesStage`

The current sales stage

## Returns

`SalesStage` \| `null`

The appropriate sales stage or null if no auto-update needed
