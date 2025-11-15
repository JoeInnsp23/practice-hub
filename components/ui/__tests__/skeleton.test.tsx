import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  describe("basic rendering", () => {
    it("should render with default variant", () => {
      const { container } = render(<Skeleton className="h-4 w-32" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toBeTruthy();
      expect(skeleton?.className).toMatch(/\[background:var\(--skeleton-color/);
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-32");
    });

    it("should render with shimmer variant", () => {
      const { container } = render(
        <Skeleton variant="shimmer" className="h-4 w-32" />,
      );
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toBeTruthy();
      expect(skeleton).toHaveClass("skeleton-shimmer");
      expect(skeleton?.className).not.toMatch(
        /\[background:var\(--skeleton-color/,
      );
      expect(skeleton).not.toHaveClass("animate-pulse");
    });

    it("should apply className prop", () => {
      const { container } = render(<Skeleton className="custom-class h-4" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("custom-class");
    });

    it("should forward props", () => {
      const { container } = render(
        <Skeleton className="h-4" data-testid="skeleton" />,
      );
      const skeleton = container.querySelector('[data-testid="skeleton"]');
      expect(skeleton).toBeTruthy();
    });
  });

  describe("variants", () => {
    it("should use default variant when not specified", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton?.className).toMatch(/\[background:var\(--skeleton-color/);
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("should apply shimmer variant", () => {
      const { container } = render(<Skeleton variant="shimmer" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("skeleton-shimmer");
    });
  });

  describe("hub color support", () => {
    it("should not set CSS variable when hubColor is not provided", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector(
        '[data-slot="skeleton"]',
      ) as HTMLElement;
      expect(skeleton).toBeTruthy();
      expect(skeleton.style.getPropertyValue("--skeleton-color")).toBe("");
    });

    it("should set CSS variable when hubColor is provided", () => {
      const testColor = "#f97316";
      const { container } = render(<Skeleton hubColor={testColor} />);
      const skeleton = container.querySelector(
        '[data-slot="skeleton"]',
      ) as HTMLElement;
      expect(skeleton).toBeTruthy();
      expect(skeleton.style.getPropertyValue("--skeleton-color")).toBe(
        testColor,
      );
    });

    it("should work with oklch color format", () => {
      const testColor = "oklch(0.56 0.15 196.6)";
      const { container } = render(<Skeleton hubColor={testColor} />);
      const skeleton = container.querySelector(
        '[data-slot="skeleton"]',
      ) as HTMLElement;
      expect(skeleton).toBeTruthy();
      expect(skeleton.style.getPropertyValue("--skeleton-color")).toBe(
        testColor,
      );
    });

    it("should preserve existing inline styles when hubColor is provided", () => {
      const testColor = "#3b82f6";
      const { container } = render(
        <Skeleton hubColor={testColor} style={{ opacity: 0.5 }} />,
      );
      const skeleton = container.querySelector(
        '[data-slot="skeleton"]',
      ) as HTMLElement;
      expect(skeleton).toBeTruthy();
      expect(skeleton.style.getPropertyValue("--skeleton-color")).toBe(
        testColor,
      );
      expect(skeleton.style.opacity).toBe("0.5");
    });
  });
});
