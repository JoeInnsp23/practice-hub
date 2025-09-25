"use client";

import { useState } from "react";
import { PracticeHubSidebar } from "@/components/practice-hub/sidebar";
import { PracticeHubHeader } from "@/components/practice-hub/header";
import { cn } from "@/lib/utils";

export default function PracticeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PracticeHubSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <PracticeHubHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}
