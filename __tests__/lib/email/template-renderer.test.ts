import { describe, expect, it } from "vitest";
import {
  extractVariables,
  renderTemplate,
  type TemplateVariables,
  validateTemplate,
} from "@/lib/email/template-renderer";

describe("Template Renderer", () => {
  describe("renderTemplate", () => {
    it("should substitute basic variables", () => {
      const template =
        "Hello {client_name}, your task {task_name} is due on {due_date}";
      const variables: TemplateVariables = {
        client_name: "ABC Manufacturing",
        task_name: "VAT Return Q3",
        due_date: "2025-11-15",
      };

      const result = renderTemplate(template, variables);

      expect(result).toBe(
        "Hello ABC Manufacturing, your task VAT Return Q3 is due on 2025-11-15",
      );
    });

    it("should escape HTML in variables by default", () => {
      const template = "Hello {client_name}";
      const variables: TemplateVariables = {
        client_name: "<script>alert('XSS')</script>",
      };

      const result = renderTemplate(template, variables);

      expect(result).toBe(
        "Hello &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;",
      );
      expect(result).not.toContain("<script>");
    });

    it("should leave unreplaced variables unchanged if not provided", () => {
      const template = "Hello {client_name}, task: {task_name}";
      const variables: TemplateVariables = {
        client_name: "ABC Manufacturing",
      };

      const result = renderTemplate(template, variables);

      // Variables not in the object are left unchanged
      expect(result).toBe("Hello ABC Manufacturing, task: {task_name}");
    });

    it("should use custom placeholder for null values", () => {
      const template = "Hello {client_name}";
      const variables: TemplateVariables = {
        client_name: null,
      };

      const result = renderTemplate(template, variables, {
        missingValuePlaceholder: "[NOT SET]",
      });

      expect(result).toBe("Hello [NOT SET]");
    });

    it("should handle null values", () => {
      const template = "Hello {client_name}";
      const variables: TemplateVariables = {
        client_name: null,
      };

      const result = renderTemplate(template, variables);

      expect(result).toBe("Hello N/A");
    });

    it("should not escape HTML when escapeHtml is false", () => {
      const template = "Content: {client_name}";
      const variables: TemplateVariables = {
        client_name: "<strong>Bold Text</strong>",
      };

      const result = renderTemplate(template, variables, { escapeHtml: false });

      expect(result).toBe("Content: <strong>Bold Text</strong>");
    });

    it("should handle multiple occurrences of same variable", () => {
      const template =
        "{client_name} has a task. Reminder for {client_name}: complete task.";
      const variables: TemplateVariables = {
        client_name: "ABC Manufacturing",
      };

      const result = renderTemplate(template, variables);

      expect(result).toBe(
        "ABC Manufacturing has a task. Reminder for ABC Manufacturing: complete task.",
      );
    });

    it("should handle all supported variables", () => {
      const template =
        "{client_name} {task_name} {due_date} {staff_name} {company_name} {workflow_name} {stage_name}";
      const variables: TemplateVariables = {
        client_name: "ABC Ltd",
        task_name: "VAT Return",
        due_date: "2025-11-15",
        staff_name: "Sarah Johnson",
        company_name: "Demo Accounting",
        workflow_name: "Quarterly VAT",
        stage_name: "Review",
      };

      const result = renderTemplate(template, variables);

      expect(result).toBe(
        "ABC Ltd VAT Return 2025-11-15 Sarah Johnson Demo Accounting Quarterly VAT Review",
      );
    });
  });

  describe("extractVariables", () => {
    it("should extract all variables from template", () => {
      const template = "Hello {client_name}, task {task_name} due {due_date}";

      const result = extractVariables(template);

      expect(result).toEqual(["client_name", "task_name", "due_date"]);
    });

    it("should handle templates with no variables", () => {
      const template = "Hello, this is a static template.";

      const result = extractVariables(template);

      expect(result).toEqual([]);
    });

    it("should deduplicate repeated variables", () => {
      const template = "{client_name} and {client_name} again";

      const result = extractVariables(template);

      expect(result).toEqual(["client_name"]);
    });

    it("should handle nested braces correctly", () => {
      const template = "Value is {{client_name}} with {task_name}";

      const result = extractVariables(template);

      // Should extract both, even with nested braces
      expect(result).toContain("task_name");
    });
  });

  describe("validateTemplate", () => {
    const supportedVariables = [
      "client_name",
      "task_name",
      "due_date",
      "staff_name",
      "company_name",
      "workflow_name",
      "stage_name",
    ];

    it("should validate template with all supported variables", () => {
      const template = "Hello {client_name}, task: {task_name}";

      const result = validateTemplate(template, supportedVariables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect unsupported variables", () => {
      const template = "Hello {client_name}, invoice: {invoice_number}";

      const result = validateTemplate(template, supportedVariables);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("invoice_number");
      expect(result.errors[0]).toContain("Unknown variable");
    });

    it("should detect multiple unsupported variables", () => {
      const template = "Hello {client_name}, {invoice_number} and {order_id}";

      const result = validateTemplate(template, supportedVariables);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain("invoice_number");
      expect(result.errors[1]).toContain("order_id");
    });

    it("should validate empty template", () => {
      const template = "";

      const result = validateTemplate(template, supportedVariables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate template with no variables", () => {
      const template = "This is a static template with no variables.";

      const result = validateTemplate(template, supportedVariables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("XSS Protection", () => {
    it("should escape < and >", () => {
      const template = "{client_name}";
      const variables: TemplateVariables = {
        client_name: "<div>test</div>",
      };

      const result = renderTemplate(template, variables);

      expect(result).not.toContain("<div>");
      expect(result).toContain("&lt;div&gt;");
    });

    it("should escape quotes", () => {
      const template = "{client_name}";
      const variables: TemplateVariables = {
        client_name: 'Test "quoted" text',
      };

      const result = renderTemplate(template, variables);

      expect(result).toContain("&quot;");
    });

    it("should escape ampersands", () => {
      const template = "{client_name}";
      const variables: TemplateVariables = {
        client_name: "Smith & Sons",
      };

      const result = renderTemplate(template, variables);

      expect(result).toContain("&amp;");
    });

    it("should prevent script injection", () => {
      const template = "<p>Hello {client_name}</p>";
      const variables: TemplateVariables = {
        client_name: '"><script>alert("XSS")</script><p x="',
      };

      const result = renderTemplate(template, variables);

      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("should prevent event handler injection by escaping quotes", () => {
      const template = "<a href='#'>Click {client_name}</a>";
      const variables: TemplateVariables = {
        client_name: "' onerror='alert(1)' x='",
      };

      const result = renderTemplate(template, variables);

      // Quotes should be escaped, making the attribute injection safe
      expect(result).toContain("&#39;");
      // The escaped output should not create a valid attribute
      expect(result).not.toContain("onerror='alert");
    });
  });
});
