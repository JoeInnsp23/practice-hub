import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonText } from "../skeleton-text";

describe("SkeletonText", () => {
  describe("basic rendering", () => {
    it("should render text skeleton", () => {
      const { container } = render(<SkeletonText />);
      const textWrapper = container.querySelector(
        '[data-slot="skeleton-text"]',
      );
      expect(textWrapper).toBeTruthy();
    });

    it("should render default number of lines", () => {
      const { container } = render(<SkeletonText />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(3); // Default lines
    });

    it("should apply className prop", () => {
      const { container } = render(<SkeletonText className="custom-class" />);
      const textWrapper = container.querySelector(
        '[data-slot="skeleton-text"]',
      );
      expect(textWrapper).toHaveClass("custom-class");
    });
  });

  describe("lines prop", () => {
    it("should render specified number of lines", () => {
      const { container } = render(<SkeletonText lines={5} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(5);
    });

    it("should render with 1 line", () => {
      const { container } = render(<SkeletonText lines={1} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(1);
    });
  });

  describe("lastLineShorter prop", () => {
    it("should make last line shorter by default", () => {
      const { container } = render(<SkeletonText lines={3} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      const lastSkeleton = skeletons[skeletons.length - 1];
      expect(lastSkeleton).toHaveClass("w-5/6");
    });

    it("should make all lines full width when lastLineShorter is false", () => {
      const { container } = render(
        <SkeletonText lines={3} lastLineShorter={false} />,
      );
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass("w-full");
      });
    });

    it("should make last line shorter when lastLineShorter is true", () => {
      const { container } = render(
        <SkeletonText lines={3} lastLineShorter={true} />,
      );
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      const lastSkeleton = skeletons[skeletons.length - 1];
      expect(lastSkeleton).toHaveClass("w-5/6");
    });
  });
});
