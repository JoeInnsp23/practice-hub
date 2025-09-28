"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodically check connection by pinging the server
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-cache",
        });

        if (!response.ok && isOnline) {
          setIsOnline(false);
          setShowStatus(true);
        } else if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
          setShowStatus(true);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <Alert
            variant={isOnline ? "default" : "destructive"}
            className={`${
              isOnline
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-destructive"
            }`}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertDescription className="ml-2">
              {isOnline
                ? "Connection restored"
                : "You are offline. Some features may be unavailable."}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}