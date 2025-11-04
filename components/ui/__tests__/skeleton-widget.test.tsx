import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonWidget } from "../skeleton-widget";

describe("SkeletonWidget", () => {
  describe("basic rendering", () => {
    it("should render widget skeleton", () => {
      const { container } = render(<SkeletonWidget />);
      const widget = container.querySelector('[data-slot="skeleton-widget"]');
      expect(widget).toBeTruthy();
      expect(widget).toHaveClass("glass-card");
    });

    it("should render skeleton title by default", () => {
      const { container } = render(<SkeletonWidget />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(2); // Title + value skeletons
    });

    it("should apply className prop", () => {
      const { container } = render(<SkeletonWidget className="custom-class" />);
      const widget = container.querySelector('[data-slot="skeleton-widget"]');
      expect(widget).toHaveClass("custom-class");
    });
  });

  describe("title prop", () => {
    it("should render skeleton title when title is not provided", () => {
      const { container } = render(<SkeletonWidget />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("should render provided title", () => {
      const { container } = render(<SkeletonWidget title="Loading Stats" />);
      const title = container.querySelector("h3");
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe("Loading Stats");
    });

    it("should render skeleton title when title is empty string", () => {
      const { container } = render(<SkeletonWidget title="" />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("showChart prop", () => {
    it("should not show chart by default", () => {
      const { container } = render(<SkeletonWidget />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // Without chart, should have fewer skeletons
      expect(skeletons.length).toBeLessThanOrEqual(5);
    });

    it("should show chart when showChart is true", () => {
      const { container } = render(<SkeletonWidget showChart />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      // With chart, should have more skeletons (chart area)
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it("should render chart skeleton with correct classes", () => {
      const { container } = render(<SkeletonWidget showChart />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      const chartSkeleton = Array.from(skeletons).find((skeleton) =>
        skeleton.classList.contains("h-32"),
      );
      expect(chartSkeleton).toBeTruthy();
    });
  });

  describe("combined props", () => {
    it("should render with title and chart", () => {
      const { container } = render(
        <SkeletonWidget title="Revenue" showChart />,
      );
      const widget = container.querySelector('[data-slot="skeleton-widget"]');
      expect(widget).toBeTruthy();
      const title = container.querySelector("h3");
      expect(title?.textContent).toBe("Revenue");
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });
});
