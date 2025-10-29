[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/template-renderer](../README.md) / extractVariables

# Function: extractVariables()

> **extractVariables**(`template`): `string`[]

Defined in: [lib/email/template-renderer.ts:130](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/email/template-renderer.ts#L130)

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
