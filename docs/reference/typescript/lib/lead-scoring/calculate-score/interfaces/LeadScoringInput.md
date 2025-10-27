[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/lead-scoring/calculate-score](../README.md) / LeadScoringInput

# Interface: LeadScoringInput

Defined in: [lib/lead-scoring/calculate-score.ts:14](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L14)

Lead Scoring Algorithm

Calculates a qualification score (1-10) for leads based on multiple factors:
- Estimated turnover (revenue potential)
- Number of interested services (engagement level)
- Industry alignment (strategic fit)
- Company size (stability and complexity)
- Business type (service potential)

Higher scores indicate leads with greater potential value and fit.

## Properties

### businessType

> **businessType**: `string`

Defined in: [lib/lead-scoring/calculate-score.ts:19](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L19)

***

### estimatedEmployees

> **estimatedEmployees**: `number`

Defined in: [lib/lead-scoring/calculate-score.ts:16](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L16)

***

### estimatedTurnover

> **estimatedTurnover**: `number`

Defined in: [lib/lead-scoring/calculate-score.ts:15](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L15)

***

### industry

> **industry**: `string`

Defined in: [lib/lead-scoring/calculate-score.ts:18](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L18)

***

### interestedServices

> **interestedServices**: `string`[]

Defined in: [lib/lead-scoring/calculate-score.ts:17](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/lead-scoring/calculate-score.ts#L17)
