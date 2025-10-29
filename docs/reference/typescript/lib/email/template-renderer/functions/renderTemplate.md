[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/template-renderer](../README.md) / renderTemplate

# Function: renderTemplate()

> **renderTemplate**(`template`, `variables`, `options?`): `string`

Defined in: [lib/email/template-renderer.ts:83](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/email/template-renderer.ts#L83)

Renders an email template by substituting variables with actual values

Features:
- Replaces all occurrences of {variable_name} with actual values
- Escapes HTML to prevent XSS attacks
- Handles missing variables gracefully (renders as "N/A")
- Case-sensitive variable matching

## Parameters

### template

`string`

Email template with {variable} placeholders

### variables

[`TemplateVariables`](../interfaces/TemplateVariables.md)

Variable values to substitute

### options?

Rendering options

#### escapeHtml?

`boolean`

Whether to escape HTML (default: true for security)

#### missingValuePlaceholder?

`string`

Placeholder for missing variables (default: "N/A")

## Returns

`string`

Rendered template with substituted values

## Examples

```typescript
const template = "Hello {client_name}, your task {task_name} is due on {due_date}.";
const rendered = renderTemplate(template, {
  client_name: "ABC Ltd",
  task_name: "VAT Return",
  due_date: "2025-11-01"
});
// Result: "Hello ABC Ltd, your task VAT Return is due on 2025-11-01."
```

```typescript
const template = "Client: {client_name}";
const rendered = renderTemplate(template, {
  client_name: "<script>alert('XSS')</script>"
});
// Result: "Client: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
```
