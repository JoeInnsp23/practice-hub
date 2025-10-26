[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/sales-stage-automation](../README.md) / getAutoSalesStage

# Function: getAutoSalesStage()

> **getAutoSalesStage**(`newStatus`, `currentStage`): `SalesStage` \| `null`

Defined in: [lib/utils/sales-stage-automation.ts:28](https://github.com/JoeInnsp23/practice-hub/blob/484e2e6b732b598a9304bb9946ce67fbb493d71e/lib/utils/sales-stage-automation.ts#L28)

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
