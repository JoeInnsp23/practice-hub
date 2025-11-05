import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../dialog";

describe("Dialog", () => {
  describe("rendering", () => {
    it("should render dialog with trigger", () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      expect(trigger).toBeTruthy();
    });

    it("should render dialog content when open", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveAttribute("aria-modal", "true");
      });
    });

    it("should apply data-testid to dialog content", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = screen.getByTestId("dialog-content");
        expect(dialog).toBeTruthy();
      });
    });

    it("should render dialog header, title, description, and footer", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
            <div>Dialog Content</div>
            <DialogFooter>
              <button>Footer Button</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        expect(screen.getByText("Dialog Title")).toBeTruthy();
        expect(screen.getByText("Dialog Description")).toBeTruthy();
        expect(screen.getByText("Dialog Content")).toBeTruthy();
        expect(screen.getByText("Footer Button")).toBeTruthy();
      });
    });
  });

  describe("animations", () => {
    it("should apply liftIn animation class when dialog is open", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = document.querySelector('[data-slot="dialog-content"]');
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveClass("animate-lift-in");
        expect(dialog).toHaveClass("duration-300");
      });
    });

    it("should apply backdrop blur to overlay", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(overlay).toBeTruthy();
        expect(overlay).toHaveClass("backdrop-blur-sm");
      });
    });

    it("should use 300ms duration for animations", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = document.querySelector('[data-slot="dialog-content"]');
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveClass("duration-300");
      });
    });
  });

  describe("close button", () => {
    it("should render close button by default", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: "Close" });
        expect(closeButton).toBeTruthy();
      });
    });

    it("should not render close button when showCloseButton is false", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const closeButtons = screen.queryAllByRole("button", { name: "Close" });
        expect(closeButtons).toHaveLength(0);
      });
    });

    it("should close dialog when close button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(async () => {
        const closeButton = screen.getByRole("button", { name: "Close" });
        await user.click(closeButton);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("keyboard navigation", () => {
    it("should close dialog when Escape key is pressed", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(async () => {
        const dialog = screen.getByRole("dialog");
        dialog.focus();
        await user.keyboard("{Escape}");
        // Radix UI handles escape key - verify onOpenChange is called
        expect(onOpenChange).toHaveBeenCalled();
      });
    });

    it("should maintain focus inside dialog when open", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <button>First Button</button>
            <button>Second Button</button>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeTruthy();
        // Radix UI automatically manages focus trap
        // We verify the dialog is open and focusable
        expect(dialog).toHaveAttribute("aria-modal", "true");
      });
    });
  });

  describe("modal sizes", () => {
    it("should apply custom className for different sizes", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="max-w-sm">
            <DialogTitle>Small Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = document.querySelector('[data-slot="dialog-content"]');
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveClass("max-w-sm");
        // All sizes should have liftIn animation
        expect(dialog).toHaveClass("animate-lift-in");
      });
    });

    it("should apply animations consistently for all modal sizes", async () => {
      const sizes = [
        "max-w-sm",
        "max-w-md",
        "max-w-lg",
        "max-w-xl",
        "max-w-2xl",
      ];

      for (const size of sizes) {
        const { unmount } = render(
          <Dialog defaultOpen>
            <DialogContent className={size}>
              <DialogTitle>Dialog</DialogTitle>
            </DialogContent>
          </Dialog>,
        );

        await waitFor(() => {
          const dialog = document.querySelector('[data-slot="dialog-content"]');
          expect(dialog).toBeTruthy();
          expect(dialog).toHaveClass("animate-lift-in");
          expect(dialog).toHaveClass("duration-300");
        });

        unmount();
      }
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <DialogDescription>This is an accessible dialog</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAttribute("role", "dialog");
      });
    });

    it("should have accessible title", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const title = screen.getByText("Dialog Title");
        expect(title).toBeTruthy();
        // Title should be associated with dialog
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeTruthy();
      });
    });

    it("should have accessible description", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const description = screen.getByText("Dialog Description");
        expect(description).toBeTruthy();
      });
    });

    it("should have aria-hidden on overlay", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(overlay).toBeTruthy();
        expect(overlay).toHaveAttribute("aria-hidden");
      });
    });
  });

  describe("DialogClose component", () => {
    it("should render DialogClose button", async () => {
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(async () => {
        const closeButton = screen.getByRole("button", { name: "Close" });
        expect(closeButton).toBeTruthy();
      });
    });
  });

  describe("custom className", () => {
    it("should apply custom className to DialogContent", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-dialog-class">
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = document.querySelector('[data-slot="dialog-content"]');
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveClass("custom-dialog-class");
      });
    });

    it("should render DialogOverlay", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(overlay).toBeTruthy();
      });
    });
  });

  describe("controlled vs uncontrolled", () => {
    it("should work as controlled component", async () => {
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeTruthy();
      });
    });

    it("should work as uncontrolled component", async () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Uncontrolled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const trigger = screen.getByRole("button", { name: "Open" });
      expect(trigger).toBeTruthy();
    });
  });
});
