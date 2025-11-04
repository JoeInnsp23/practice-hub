import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  describe("basic rendering", () => {
    it("should render button with children", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeTruthy();
      expect(button.textContent).toBe("Click me");
    });

    it("should apply default variant", () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("bg-primary");
    });

    it("should apply custom variant", () => {
      const { container } = render(
        <Button variant="destructive">Delete</Button>,
      );
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("bg-destructive");
    });

    it("should apply custom size", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("h-10");
    });

    it("should apply className prop", () => {
      const { container } = render(
        <Button className="custom-class">Test</Button>,
      );
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("custom-class");
    });

    it("should have button-feedback class for micro-interactions", () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("button-feedback");
    });
  });

  describe("loading state", () => {
    it("should show spinner when isLoading is true", () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("svg");
      expect(spinner).toBeTruthy();
      expect(spinner).toHaveClass("animate-spin");
    });

    it("should disable button when isLoading is true", () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should show loadingText when isLoading and loadingText provided", () => {
      render(
        <Button isLoading loadingText="Loading...">
          Submit
        </Button>,
      );
      const button = screen.getByRole("button", { name: "Loading..." });
      expect(button).toBeTruthy();
      expect(button.textContent).toContain("Loading...");
    });

    it("should show children when isLoading but no loadingText", () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toBeTruthy();
      expect(button.textContent).toContain("Submit");
    });

    it("should show spinner and loadingText together", () => {
      render(
        <Button isLoading loadingText="Processing...">
          Submit
        </Button>,
      );
      const button = screen.getByRole("button");
      const spinner = button.querySelector("svg");
      expect(spinner).toBeTruthy();
      expect(button.textContent).toContain("Processing...");
    });

    it("should not show spinner when isLoading is false", () => {
      render(<Button isLoading={false}>Submit</Button>);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("svg");
      expect(spinner).toBeNull();
    });

    it("should not disable button when isLoading is false", () => {
      render(<Button isLoading={false}>Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should disable button when both disabled and isLoading are true", () => {
      render(
        <Button disabled isLoading>
          Submit
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should disable button when disabled prop is true", () => {
      render(<Button disabled>Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button");
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Click me
        </Button>,
      );
      const button = screen.getByRole("button");
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not call onClick when isLoading", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Submit
        </Button>,
      );
      const button = screen.getByRole("button");
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have aria-hidden on spinner", () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole("button");
      const spinner = button.querySelector("svg");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("should be accessible when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("disabled");
    });

    it("should be accessible when loading", () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("disabled");
    });
  });

  describe("asChild prop", () => {
    it("should render as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeTruthy();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should apply button styles to child when asChild is true", () => {
      const { container } = render(
        <Button asChild variant="destructive">
          <a href="/test">Link</a>
        </Button>,
      );
      const link = container.querySelector("a");
      expect(link).toHaveClass("bg-destructive");
    });
  });

  describe("all variants", () => {
    it("should render default variant", () => {
      const { container } = render(<Button variant="default">Default</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("bg-primary");
    });

    it("should render destructive variant", () => {
      const { container } = render(
        <Button variant="destructive">Destructive</Button>,
      );
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("bg-destructive");
    });

    it("should render outline variant", () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("border");
    });

    it("should render secondary variant", () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>,
      );
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("bg-secondary");
    });

    it("should render ghost variant", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("should render link variant", () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("all sizes", () => {
    it("should render default size", () => {
      const { container } = render(<Button size="default">Default</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("h-9");
    });

    it("should render sm size", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("h-8");
    });

    it("should render lg size", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("h-10");
    });

    it("should render icon size", () => {
      const { container } = render(<Button size="icon">Icon</Button>);
      const button = container.querySelector('[data-slot="button"]');
      expect(button).toHaveClass("size-9");
    });
  });
});
