import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FloatingLabelInput } from "../input-floating";

describe("FloatingLabelInput", () => {
  describe("basic rendering", () => {
    it("should render input with label", () => {
      render(<FloatingLabelInput label="Email" />);
      const input = screen.getByLabelText("Email");
      expect(input).toBeTruthy();
      expect(input.tagName).toBe("INPUT");
    });

    it("should render with custom id", () => {
      render(<FloatingLabelInput label="Email" id="custom-id" />);
      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("id", "custom-id");
    });

    it("should generate id when not provided", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = container.querySelector("input");
      const label = container.querySelector("label");
      expect(input?.id).toBeTruthy();
      expect(label?.getAttribute("for")).toBe(input?.id);
    });

    it("should apply className prop", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" className="custom-class" />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveClass("custom-class");
    });

    it("should forward input props", () => {
      render(<FloatingLabelInput label="Email" type="email" required />);
      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toHaveAttribute("required");
    });
  });

  describe("label floating behavior", () => {
    it("should have label in default position when empty and not focused", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-1/2");
      expect(label).toHaveClass("-translate-y-1/2");
      expect(label).toHaveClass("text-sm");
    });

    it("should float label up on focus", async () => {
      const user = userEvent.setup();
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = screen.getByLabelText("Email");
      const label = container.querySelector("label");

      await user.click(input);

      expect(label).toHaveClass("top-2");
      expect(label).toHaveClass("text-xs");
      expect(label).not.toHaveClass("top-1/2");
    });

    it("should float label up when input has value (controlled)", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" value="test@example.com" />,
      );
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-2");
      expect(label).toHaveClass("text-xs");
    });

    it("should float label up when input has defaultValue (uncontrolled)", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" defaultValue="test@example.com" />,
      );
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-2");
      expect(label).toHaveClass("text-xs");
    });

    it("should float label with smooth transition", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const label = container.querySelector("label");
      expect(label).toHaveClass("transition-all");
      expect(label).toHaveClass("duration-200");
      expect(label).toHaveClass("ease-out");
    });

    it("should keep label floating after blur if value exists", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FloatingLabelInput label="Email" defaultValue="test@example.com" />,
      );
      const input = screen.getByLabelText("Email");
      const label = container.querySelector("label");

      // Label should be floating initially (has value)
      expect(label).toHaveClass("top-2");

      await user.click(input);
      await user.click(document.body); // Blur

      // Label should still be floating (has value)
      expect(label).toHaveClass("top-2");
    });

    it("should return label to default position after blur if empty", async () => {
      const user = userEvent.setup();
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = screen.getByLabelText("Email");
      const label = container.querySelector("label");

      await user.click(input);
      expect(label).toHaveClass("top-2");

      await user.click(document.body); // Blur
      expect(label).toHaveClass("top-1/2");
    });
  });

  describe("error state", () => {
    it("should display error message", () => {
      render(<FloatingLabelInput label="Email" error="Email is required" />);
      const errorMessage = screen.getByText("Email is required");
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toHaveClass("text-destructive");
      expect(errorMessage).toHaveClass("input-error-message");
    });

    it("should apply error styling to input", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" error="Email is required" />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveClass("border-destructive");
      expect(input).toHaveClass("input-error-shake");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should have error message with role alert", () => {
      render(<FloatingLabelInput label="Email" error="Email is required" />);
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toBe("Email is required");
    });

    it("should associate error message with input via aria-describedby", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" error="Email is required" />,
      );
      const input = container.querySelector("input");
      const errorMessage = container.querySelector("p");
      const inputId = input?.getAttribute("id");
      expect(input).toHaveAttribute("aria-describedby", `${inputId}-error`);
      expect(errorMessage).toHaveAttribute("id", `${inputId}-error`);
    });

    it("should not show error message when error prop is not provided", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const errorMessage = container.querySelector(".input-error-message");
      expect(errorMessage).toBeNull();
    });
  });

  describe("success state", () => {
    it("should display success checkmark when success prop is true", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" success />,
      );
      const checkmark = container.querySelector("svg");
      expect(checkmark).toBeTruthy();
      expect(checkmark).toHaveClass("text-green-500");
      expect(checkmark).toHaveClass("animate-fade-in");
    });

    it("should apply success styling to input", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" success />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveClass("border-green-500");
    });

    it("should not show success checkmark when success is false", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" success={false} />,
      );
      const checkmark = container.querySelector("svg");
      expect(checkmark).toBeNull();
    });

    it("should not show success checkmark when error is present", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" success error="Error" />,
      );
      const checkmark = container.querySelector("svg");
      expect(checkmark).toBeNull();
    });

    it("should have success checkmark with aria-hidden", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" success />,
      );
      const checkmark = container.querySelector("svg");
      expect(checkmark).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("focus states", () => {
    it("should call onFocus when input is focused", async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<FloatingLabelInput label="Email" onFocus={handleFocus} />);
      const input = screen.getByLabelText("Email");

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should call onBlur when input is blurred", async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<FloatingLabelInput label="Email" onBlur={handleBlur} />);
      const input = screen.getByLabelText("Email");

      await user.click(input);
      await user.click(document.body);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("should have focus-visible styles", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = container.querySelector("input");
      expect(input).toHaveClass("focus-visible:border-ring");
      expect(input).toHaveClass("focus-visible:ring-ring/50");
      expect(input).toHaveClass("focus-visible:ring-[3px]");
    });

    it("should support hub color via moduleColor prop", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" moduleColor="#3b82f6" />,
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveStyle({ "--module-color": "#3b82f6" });
    });
  });

  describe("controlled vs uncontrolled", () => {
    it("should work as controlled input", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" value="test@example.com" />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveValue("test@example.com");
    });

    it("should work as uncontrolled input", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" defaultValue="test@example.com" />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveValue("test@example.com");
    });

    it("should handle onChange for controlled input", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <FloatingLabelInput label="Email" value="" onChange={handleChange} />,
      );
      const input = screen.getByLabelText("Email");

      await user.type(input, "test");

      expect(handleChange).toHaveBeenCalled();
    });

    it("should handle onChange for uncontrolled input", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <FloatingLabelInput
          label="Email"
          defaultValue=""
          onChange={handleChange}
        />,
      );
      const input = screen.getByLabelText("Email");

      await user.type(input, "test");

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue("test");
    });

    it("should update internal state for uncontrolled input", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FloatingLabelInput label="Email" defaultValue="" />,
      );
      const input = screen.getByLabelText("Email");
      const label = container.querySelector("label");

      // Label should be in default position initially
      expect(label).toHaveClass("top-1/2");

      // Type something - should update internal state and float label
      await user.type(input, "test");

      expect(input).toHaveValue("test");
      expect(label).toHaveClass("top-2");
    });

    it("should not update internal state for controlled input", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <FloatingLabelInput label="Email" value="" onChange={handleChange} />,
      );
      const input = screen.getByLabelText("Email");

      await user.type(input, "test");

      // handleChange should be called, but value should remain controlled
      expect(handleChange).toHaveBeenCalled();
      // For controlled input, value stays as prop (empty string)
      expect(input).toHaveValue("");
    });
  });

  describe("accessibility", () => {
    it("should associate label with input via htmlFor", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = container.querySelector("input");
      const label = container.querySelector("label");
      expect(label?.getAttribute("for")).toBe(input?.id);
    });

    it("should have aria-invalid when error is present", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" error="Error" />,
      );
      const input = container.querySelector("input");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not have aria-invalid when no error", () => {
      const { container } = render(<FloatingLabelInput label="Email" />);
      const input = container.querySelector("input");
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("should have aria-describedby pointing to error message", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" error="Error message" />,
      );
      const input = container.querySelector("input");
      const errorMessage = container.querySelector("p");
      const inputId = input?.getAttribute("id");
      expect(input).toHaveAttribute("aria-describedby", `${inputId}-error`);
      expect(errorMessage).toHaveAttribute("id", `${inputId}-error`);
    });

    it("should support disabled state", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" disabled />,
      );
      const input = container.querySelector("input");
      expect(input).toBeDisabled();
    });
  });

  describe("value handling edge cases", () => {
    it("should handle empty string value", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" value="" />,
      );
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-1/2");
    });

    it("should handle null value", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" value={null as unknown as string} />,
      );
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-1/2");
    });

    it("should handle undefined value", () => {
      const { container } = render(
        <FloatingLabelInput label="Email" value={undefined} />,
      );
      const label = container.querySelector("label");
      expect(label).toHaveClass("top-1/2");
    });

    it("should handle zero value as non-empty", () => {
      const { container } = render(
        <FloatingLabelInput label="Number" type="number" value={0} />,
      );
      const label = container.querySelector("label");
      // Zero should be considered a value
      expect(label).toHaveClass("top-2");
    });
  });

  describe("input types", () => {
    it("should support email type", () => {
      render(<FloatingLabelInput label="Email" type="email" />);
      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should support password type", () => {
      render(<FloatingLabelInput label="Password" type="password" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should support number type", () => {
      render(<FloatingLabelInput label="Age" type="number" />);
      const input = screen.getByLabelText("Age");
      expect(input).toHaveAttribute("type", "number");
    });
  });
});
