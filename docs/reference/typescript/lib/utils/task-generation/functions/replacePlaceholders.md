[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/task-generation](../README.md) / replacePlaceholders

# Function: replacePlaceholders()

> **replacePlaceholders**(`template`, `data`): `string`

Defined in: [lib/utils/task-generation.ts:33](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/utils/task-generation.ts#L33)

Replace placeholders in template strings with actual values

Supported placeholders:
- {client_name}
- {service_name}
- {company_number}
- {period}
- {month}
- {year}
- {tax_year}

## Parameters

### template

`string`

Template string with placeholders

### data

[`PlaceholderData`](../interfaces/PlaceholderData.md)

Data to replace placeholders with

## Returns

`string`

String with placeholders replaced
