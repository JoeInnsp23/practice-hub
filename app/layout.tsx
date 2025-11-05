import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { TRPCProvider } from "@/app/providers/trpc-provider";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Footer } from "@/components/shared/footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Practice Hub",
  description: "Professional practice management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            <div className="flex-1">{children}</div>
            <Footer />
            <FeedbackButton />
            <Toaster position="top-right" />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
