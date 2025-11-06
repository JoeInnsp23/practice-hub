"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle({
  isOnColoredBackground = false,
}: {
  isOnColoredBackground?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4" />
        <div className="h-5 w-9" />
        <div className="h-4 w-4" />
      </div>
    );
  }

  const iconClasses = isOnColoredBackground
    ? "text-white/90"
    : "text-slate-500 dark:text-slate-400";

  return (
    <div className="flex items-center space-x-2">
      <Sun className={`h-4 w-4 ${iconClasses}`} />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-slate-600 data-[state=unchecked]:bg-slate-300"
      />
      <Moon className={`h-4 w-4 ${iconClasses}`} />
    </div>
  );
}
