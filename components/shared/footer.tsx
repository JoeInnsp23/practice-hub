import Link from "next/link";

/**
 * Global Footer Component
 * Displays legal links and copyright information
 * Should be included in the root layout
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/cookie-policy"
              className="hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-sm">
            © {currentYear} Practice Hub. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
