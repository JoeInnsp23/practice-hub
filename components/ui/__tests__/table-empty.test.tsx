import { render, screen } from "@testing-library/react";
import { FileText, Inbox } from "lucide-react";
import { describe, expect, it } from "vitest";
import { TableEmpty } from "../table-empty";

describe("TableEmpty", () => {
  describe("basic rendering", () => {
    it("should render empty state with default props", () => {
      render(<TableEmpty />);
      const emptyState = screen.getByText("No data available");
      expect(emptyState).toBeTruthy();
      expect(emptyState.tagName).toBe("H3");
    });

    it("should render default description", () => {
      render(<TableEmpty />);
      const description = screen.getByText("There are no items to display.");
      expect(description).toBeTruthy();
      expect(description.tagName).toBe("P");
    });

    it("should render default icon", () => {
      const { container } = render(<TableEmpty />);
      const icon = container.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    it("should apply className prop", () => {
      const { container } = render(<TableEmpty className="custom-class" />);
      const emptyState = container.querySelector('[data-slot="table-empty"]');
      expect(emptyState).toHaveClass("custom-class");
    });
  });

  describe("title prop", () => {
    it("should render custom title", () => {
      render(<TableEmpty title="No tasks found" />);
      const title = screen.getByText("No tasks found");
      expect(title).toBeTruthy();
      expect(title.tagName).toBe("H3");
    });

    it("should render empty title", () => {
      const { container } = render(<TableEmpty title="" />);
      const emptyState = container.querySelector('[data-slot="table-empty"]');
      const title = emptyState?.querySelector("h3");
      expect(title?.textContent).toBe("");
    });
  });

  describe("description prop", () => {
    it("should render custom description", () => {
      render(
        <TableEmpty description="Create your first task to get started." />,
      );
      const description = screen.getByText(
        "Create your first task to get started.",
      );
      expect(description).toBeTruthy();
      expect(description.tagName).toBe("P");
    });

    it("should render empty description", () => {
      const { container } = render(<TableEmpty description="" />);
      const emptyState = container.querySelector('[data-slot="table-empty"]');
      const description = emptyState?.querySelector("p");
      expect(description?.textContent).toBe("");
    });
  });

  describe("icon prop", () => {
    it("should render default FileQuestion icon", () => {
      const { container } = render(<TableEmpty />);
      const icon = container.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    it("should render custom icon", () => {
      const { container } = render(<TableEmpty icon={FileText} />);
      const icon = container.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    it("should render Inbox icon", () => {
      const { container } = render(<TableEmpty icon={Inbox} />);
      const icon = container.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    it("should apply icon classes", () => {
      const { container } = render(<TableEmpty />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-12");
      expect(icon).toHaveClass("w-12");
      expect(icon).toHaveClass("text-muted-foreground");
      expect(icon).toHaveClass("mb-4");
    });
  });

  describe("layout and styling", () => {
    it("should have correct layout classes", () => {
      const { container } = render(<TableEmpty />);
      const emptyState = container.querySelector('[data-slot="table-empty"]');
      expect(emptyState).toHaveClass("flex");
      expect(emptyState).toHaveClass("flex-col");
      expect(emptyState).toHaveClass("items-center");
      expect(emptyState).toHaveClass("justify-center");
      expect(emptyState).toHaveClass("py-12");
      expect(emptyState).toHaveClass("text-center");
    });

    it("should have title styling", () => {
      const { container } = render(<TableEmpty />);
      const title = container.querySelector("h3");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
      expect(title).toHaveClass("mb-2");
    });

    it("should have description styling", () => {
      const { container } = render(<TableEmpty />);
      const description = container.querySelector("p");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-muted-foreground");
    });
  });

  describe("combined props", () => {
    it("should render with all custom props", () => {
      render(
        <TableEmpty
          title="No tasks"
          description="Create a task to get started."
          icon={Inbox}
          className="custom-class"
        />,
      );
      const title = screen.getByText("No tasks");
      const description = screen.getByText("Create a task to get started.");
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      render(<TableEmpty title="No data" />);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toBeTruthy();
      expect(title.textContent).toBe("No data");
    });

    it("should forward props to root element", () => {
      const { container } = render(<TableEmpty data-testid="table-empty" />);
      const emptyState = container.querySelector('[data-testid="table-empty"]');
      expect(emptyState).toBeTruthy();
    });
  });
});
