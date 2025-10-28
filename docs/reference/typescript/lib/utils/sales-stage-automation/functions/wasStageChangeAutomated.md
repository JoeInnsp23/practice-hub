[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/sales-stage-automation](../README.md) / wasStageChangeAutomated

# Function: wasStageChangeAutomated()

> **wasStageChangeAutomated**(`_oldStatus`, `newStatus`, `oldStage`, `newStage`): `boolean`

Defined in: [lib/utils/sales-stage-automation.ts:71](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/utils/sales-stage-automation.ts#L71)

Checks if a sales stage change was triggered by automation

## Parameters

### \_oldStatus

`ProposalStatus`

### newStatus

`ProposalStatus`

The new proposal status

### oldStage

`SalesStage`

The previous sales stage

### newStage

`SalesStage`

The new sales stage

## Returns

`boolean`

true if the stage change was automated
