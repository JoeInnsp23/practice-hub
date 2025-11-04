import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonTable } from "../skeleton-table";

describe("SkeletonTable", () => {
  describe("basic rendering", () => {
    it("should render table skeleton", () => {
      const { container } = render(<SkeletonTable />);
      const tableWrapper = container.querySelector(
        '[data-slot="skeleton-table"]',
      );
      expect(tableWrapper).toBeTruthy();
      expect(tableWrapper).toHaveClass("glass-table");
    });

    it("should render default number of rows and columns", () => {
      const { container } = render(<SkeletonTable />);
      const table = container.querySelector("table");
      expect(table).toBeTruthy();
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(5); // Default rows
    });

    it("should show header by default", () => {
      const { container } = render(<SkeletonTable />);
      const header = container.querySelector("thead");
      expect(header).toBeTruthy();
    });

    it("should apply className prop", () => {
      const { container } = render(<SkeletonTable className="custom-class" />);
      const tableWrapper = container.querySelector(
        '[data-slot="skeleton-table"]',
      );
      expect(tableWrapper).toHaveClass("custom-class");
    });
  });

  describe("rows prop", () => {
    it("should render specified number of rows", () => {
      const { container } = render(<SkeletonTable rows={10} />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(10);
    });

    it("should render with 1 row", () => {
      const { container } = render(<SkeletonTable rows={1} />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(1);
    });
  });

  describe("columns prop", () => {
    it("should render specified number of columns", () => {
      const { container } = render(<SkeletonTable columns={6} />);
      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");
      expect(cells?.length).toBe(6);
    });

    it("should render with 1 column", () => {
      const { container } = render(<SkeletonTable columns={1} />);
      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");
      expect(cells?.length).toBe(1);
    });
  });

  describe("showHeader prop", () => {
    it("should show header by default", () => {
      const { container } = render(<SkeletonTable />);
      const header = container.querySelector("thead");
      expect(header).toBeTruthy();
    });

    it("should hide header when showHeader is false", () => {
      const { container } = render(<SkeletonTable showHeader={false} />);
      const header = container.querySelector("thead");
      expect(header).toBeNull();
    });
  });

  describe("combined props", () => {
    it("should render with custom rows, columns, and no header", () => {
      const { container } = render(
        <SkeletonTable rows={3} columns={2} showHeader={false} />,
      );
      const tableWrapper = container.querySelector(
        '[data-slot="skeleton-table"]',
      );
      expect(tableWrapper).toBeTruthy();
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(3);
      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");
      expect(cells?.length).toBe(2);
      const header = container.querySelector("thead");
      expect(header).toBeNull();
    });
  });
});
