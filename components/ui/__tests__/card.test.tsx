import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent, CardHeader, CardTitle } from "../card";

describe("Card", () => {
  describe("variant prop", () => {
    it("should render with default variant when no variant specified", () => {
      const { container } = render(
        <Card>
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeTruthy();
      expect(card?.className).toContain("glass-card");
      expect(card?.className).toContain("py-6");
    });

    it("should render with default variant when variant='default'", () => {
      const { container } = render(
        <Card variant="default">
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeTruthy();
      expect(card?.className).toContain("glass-card");
      expect(card?.className).toContain("py-6");
    });

    it("should render with elevated variant when variant='elevated'", () => {
      const { container } = render(
        <Card variant="elevated">
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeTruthy();
      expect(card?.className).toContain("glass-card");
      expect(card?.className).toContain("shadow-medium");
      expect(card?.className).toContain("py-6");
    });

    it("should render with interactive variant when variant='interactive'", () => {
      const { container } = render(
        <Card variant="interactive">
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeTruthy();
      expect(card?.className).toContain("card-interactive");
    });
  });

  describe("props forwarding", () => {
    it("should forward className prop", () => {
      const { container } = render(
        <Card className="custom-class">
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain("custom-class");
    });

    it("should forward other div props", () => {
      const { container } = render(
        <Card data-testid="test-card" aria-label="Test card">
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card?.getAttribute("data-testid")).toBe("test-card");
      expect(card?.getAttribute("aria-label")).toBe("Test card");
    });
  });

  describe("base classes", () => {
    it("should always include base classes", () => {
      const { container } = render(
        <Card>
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain("text-card-foreground");
      expect(card?.className).toContain("flex");
      expect(card?.className).toContain("flex-col");
      expect(card?.className).toContain("gap-6");
      expect(card?.className).toContain("rounded-xl");
    });
  });

  describe("Card subcomponents", () => {
    it("should render CardHeader correctly", () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>,
      );

      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeTruthy();
    });

    it("should render CardContent correctly", () => {
      const { container } = render(
        <Card>
          <CardContent>Test content</CardContent>
        </Card>,
      );

      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe("Test content");
    });
  });
});
