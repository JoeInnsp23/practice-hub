import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonAvatar } from "../skeleton-avatar";

describe("SkeletonAvatar", () => {
  describe("basic rendering", () => {
    it("should render avatar skeleton", () => {
      const { container } = render(<SkeletonAvatar />);
      const avatarWrapper = container.querySelector(
        '[data-slot="skeleton-avatar"]',
      );
      expect(avatarWrapper).toBeTruthy();
    });

    it("should render default size", () => {
      const { container } = render(<SkeletonAvatar />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("h-10");
      expect(skeleton).toHaveClass("w-10");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("should apply className prop", () => {
      const { container } = render(<SkeletonAvatar className="custom-class" />);
      const avatarWrapper = container.querySelector(
        '[data-slot="skeleton-avatar"]',
      );
      expect(avatarWrapper).toHaveClass("custom-class");
    });
  });

  describe("size prop", () => {
    it("should render sm size", () => {
      const { container } = render(<SkeletonAvatar size="sm" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("h-8");
      expect(skeleton).toHaveClass("w-8");
    });

    it("should render default size", () => {
      const { container } = render(<SkeletonAvatar size="default" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("h-10");
      expect(skeleton).toHaveClass("w-10");
    });

    it("should render lg size", () => {
      const { container } = render(<SkeletonAvatar size="lg" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("h-12");
      expect(skeleton).toHaveClass("w-12");
    });

    it("should render xl size", () => {
      const { container } = render(<SkeletonAvatar size="xl" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toHaveClass("h-16");
      expect(skeleton).toHaveClass("w-16");
    });
  });

  describe("showBadge prop", () => {
    it("should not show badge by default", () => {
      const { container } = render(<SkeletonAvatar />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(1); // Only avatar, no badge
    });

    it("should show badge when showBadge is true", () => {
      const { container } = render(<SkeletonAvatar showBadge />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(2); // Avatar + badge
      const badge = skeletons[1];
      expect(badge).toHaveClass("h-3");
      expect(badge).toHaveClass("w-3");
      expect(badge).toHaveClass("rounded-full");
    });
  });

  describe("combined props", () => {
    it("should render with lg size and badge", () => {
      const { container } = render(<SkeletonAvatar size="lg" showBadge />);
      const avatarWrapper = container.querySelector(
        '[data-slot="skeleton-avatar"]',
      );
      expect(avatarWrapper).toBeTruthy();
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(2);
    });
  });
});
