/**
 * Template Variable Renderer
 *
 * Renders email templates by substituting variables with actual values.
 * Implements XSS protection by escaping HTML special characters.
 *
 * Supported variables (FR32: AC5):
 * - {client_name} - Client's business name
 * - {task_name} - Task title
 * - {due_date} - Task/workflow due date
 * - {staff_name} - Assigned staff member's name
 * - {company_name} - Tenant's company name
 * - {workflow_name} - Workflow name
 * - {stage_name} - Workflow stage name
 */

/**
 * Template variable values
 * All values are optional and will render as "N/A" if undefined
 */
export interface TemplateVariables {
  client_name?: string | null;
  task_name?: string | null;
  due_date?: string | null;
  staff_name?: string | null;
  company_name?: string | null;
  workflow_name?: string | null;
  stage_name?: string | null;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @param text - Text to escape
 * @returns HTML-safe text
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Renders an email template by substituting variables with actual values
 *
 * Features:
 * - Replaces all occurrences of {variable_name} with actual values
 * - Escapes HTML to prevent XSS attacks
 * - Handles missing variables gracefully (renders as "N/A")
 * - Case-sensitive variable matching
 *
 * @param template - Email template with {variable} placeholders
 * @param variables - Variable values to substitute
 * @param options - Rendering options
 * @returns Rendered template with substituted values
 *
 * @example
 * ```typescript
 * const template = "Hello {client_name}, your task {task_name} is due on {due_date}.";
 * const rendered = renderTemplate(template, {
 *   client_name: "ABC Ltd",
 *   task_name: "VAT Return",
 *   due_date: "2025-11-01"
 * });
 * // Result: "Hello ABC Ltd, your task VAT Return is due on 2025-11-01."
 * ```
 *
 * @example XSS Prevention
 * ```typescript
 * const template = "Client: {client_name}";
 * const rendered = renderTemplate(template, {
 *   client_name: "<script>alert('XSS')</script>"
 * });
 * // Result: "Client: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
 * ```
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
  options?: {
    /** Placeholder for missing variables (default: "N/A") */
    missingValuePlaceholder?: string;
    /** Whether to escape HTML (default: true for security) */
    escapeHtml?: boolean;
  },
): string {
  const { missingValuePlaceholder = "N/A", escapeHtml: shouldEscape = true } =
    options ?? {};

  let result = template;

  // Process each variable
  for (const [key, rawValue] of Object.entries(variables)) {
    // Handle null/undefined values
    const value = rawValue ?? missingValuePlaceholder;

    // Escape HTML if enabled (default)
    const safeValue = shouldEscape ? escapeHtml(value) : value;

    // Replace all occurrences of {variable_name}
    // Using global regex to replace all instances
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, safeValue);
  }

  return result;
}

/**
 * Extracts variable names from a template
 *
 * Useful for validating templates and displaying available variables in the UI
 *
 * @param template - Email template
 * @returns Array of variable names found in the template
 *
 * @example
 * ```typescript
 * const template = "Hello {client_name}, task {task_name} is due {due_date}.";
 * const vars = extractVariables(template);
 * // Result: ["client_name", "task_name", "due_date"]
 * ```
 */
export function extractVariables(template: string): string[] {
  const regex = /\{([a-z_]+)\}/g;
  const matches = template.matchAll(regex);
  const variables = new Set<string>();

  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
}

/**
 * Validates that a template only uses supported variables
 *
 * @param template - Email template to validate
 * @param supportedVariables - List of allowed variable names
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * const template = "Hello {client_name}, your {invalid_var} is ready.";
 * const result = validateTemplate(template, ["client_name", "task_name"]);
 * // Result: { valid: false, errors: ["Unknown variable: invalid_var"] }
 * ```
 */
export function validateTemplate(
  template: string,
  supportedVariables: string[],
): { valid: boolean; errors: string[] } {
  const usedVariables = extractVariables(template);
  const errors: string[] = [];

  for (const variable of usedVariables) {
    if (!supportedVariables.includes(variable)) {
      errors.push(`Unknown variable: ${variable}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Standard supported variables for Practice Hub email templates (FR32: AC5)
 */
export const SUPPORTED_VARIABLES = [
  "client_name",
  "task_name",
  "due_date",
  "staff_name",
  "company_name",
  "workflow_name",
  "stage_name",
] as const;

/**
 * Type-safe variable name
 */
export type SupportedVariable = (typeof SUPPORTED_VARIABLES)[number];
