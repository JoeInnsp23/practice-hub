[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/template-renderer](../README.md) / validateTemplate

# Function: validateTemplate()

> **validateTemplate**(`template`, `supportedVariables`): `object`

Defined in: [lib/email/template-renderer.ts:158](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/email/template-renderer.ts#L158)

Validates that a template only uses supported variables

## Parameters

### template

`string`

Email template to validate

### supportedVariables

`string`[]

List of allowed variable names

## Returns

`object`

Validation result with errors if any

### errors

> **errors**: `string`[]

### valid

> **valid**: `boolean`

## Example

```typescript
const template = "Hello {client_name}, your {invalid_var} is ready.";
const result = validateTemplate(template, ["client_name", "task_name"]);
// Result: { valid: false, errors: ["Unknown variable: invalid_var"] }
```
