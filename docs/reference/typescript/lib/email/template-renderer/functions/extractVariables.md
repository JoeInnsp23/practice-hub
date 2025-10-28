[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/template-renderer](../README.md) / extractVariables

# Function: extractVariables()

> **extractVariables**(`template`): `string`[]

Defined in: [lib/email/template-renderer.ts:130](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/email/template-renderer.ts#L130)

Extracts variable names from a template

Useful for validating templates and displaying available variables in the UI

## Parameters

### template

`string`

Email template

## Returns

`string`[]

Array of variable names found in the template

## Example

```typescript
const template = "Hello {client_name}, task {task_name} is due {due_date}.";
const vars = extractVariables(template);
// Result: ["client_name", "task_name", "due_date"]
```
