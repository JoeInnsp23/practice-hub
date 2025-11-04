import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonCard } from "../skeleton-card";

describe("SkeletonCard", () => {
  describe("basic rendering", () => {
    it("should render card skeleton", () => {
      const { container } = render(<SkeletonCard />);
      const card = container.querySelector('[data-slot="skeleton-card"]');
      expect(card).toBeTruthy();
      expect(card).toHaveClass("glass-card");
    });

    it("should render default number of lines", () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // 2 lines (title + subtitle) + 3 content lines = 5 total
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it("should apply className prop", () => {
      const { container } = render(<SkeletonCard className="custom-class" />);
      const card = container.querySelector('[data-slot="skeleton-card"]');
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("lines prop", () => {
    it("should render specified number of lines", () => {
      const { container } = render(<SkeletonCard lines={5} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // Should have more skeletons with 5 lines
      expect(skeletons.length).toBeGreaterThanOrEqual(7);
    });

    it("should render with 1 line", () => {
      const { container } = render(<SkeletonCard lines={1} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("showAvatar prop", () => {
    it("should not show avatar by default", () => {
      const { container } = render(<SkeletonCard />);
      const roundedSkeletons = container.querySelectorAll(
        '[data-slot="skeleton"].rounded-full',
      );
      expect(roundedSkeletons.length).toBe(0);
    });

    it("should show avatar when showAvatar is true", () => {
      const { container } = render(<SkeletonCard showAvatar />);
      const roundedSkeletons = container.querySelectorAll(
        '[data-slot="skeleton"].rounded-full',
      );
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("showActions prop", () => {
    it("should not show actions by default", () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // Without actions, should have fewer skeletons
      expect(skeletons.length).toBeLessThanOrEqual(7);
    });

    it("should show actions when showActions is true", () => {
      const { container } = render(<SkeletonCard showActions />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // With actions, should have more skeletons (2 button skeletons)
      expect(skeletons.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("combined props", () => {
    it("should render with avatar and actions", () => {
      const { container } = render(
        <SkeletonCard showAvatar showActions lines={4} />,
      );
      const card = container.querySelector('[data-slot="skeleton-card"]');
      expect(card).toBeTruthy();
    });
  });
});
