"use client";

import { useEffect, useState } from "react";

export function DateTimeDisplay({
  isOnColoredBackground = false,
}: {
  isOnColoredBackground?: boolean;
}) {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
      };

      setCurrentDate(now.toLocaleDateString("en-GB", dateOptions));
      setCurrentTime(now.toLocaleTimeString("en-GB", timeOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`hidden text-right text-sm sm:block ${
        isOnColoredBackground
          ? "text-white"
          : "text-slate-700 dark:text-slate-300"
      }`}
    >
      <div className="font-medium">{currentDate}</div>
      <div
        className={`text-xs ${
          isOnColoredBackground
            ? "text-white/80"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {currentTime}
      </div>
    </div>
  );
}
