"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type DatabaseStatus = "checking" | "connected" | "disconnected" | "error";

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>("checking");
  const [showStatus, setShowStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkDatabaseStatus = async () => {
    try {
      setStatus("checking");
      setError(null);

      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-cache",
      });

      const data = await response.json();

      if (response.ok && data.database === "connected") {
        setStatus("connected");
        // Hide success message after 3 seconds
        if (showStatus) {
          setTimeout(() => setShowStatus(false), 3000);
        }
      } else {
        setStatus("disconnected");
        setError(data.error || "Database is not available");
        setShowStatus(true);
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      setStatus("error");
      setError("Cannot connect to database server");
      setShowStatus(true);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkDatabaseStatus();
    setIsRetrying(false);
  };

  useEffect(() => {
    // Initial check
    checkDatabaseStatus();

    // Set up periodic health checks
    const interval = setInterval(checkDatabaseStatus, 60000); // Check every minute

    // Show status on first check
    const timer = setTimeout(() => {
      if (status !== "connected") {
        setShowStatus(true);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Don't show anything if connected and not showing status
  if (status === "connected" && !showStatus) {
    return null;
  }

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-40 max-w-sm"
        >
          <Alert
            variant={status === "connected" ? "default" : "destructive"}
            className={`${
              status === "connected"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : ""
            }`}
          >
            <div className="flex items-start gap-2">
              {status === "checking" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : status === "connected" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : status === "disconnected" ? (
                <Database className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}

              <div className="flex-1">
                <AlertDescription>
                  {status === "checking" && "Checking database connection..."}
                  {status === "connected" && "Database connected"}
                  {status === "disconnected" && (
                    <div className="space-y-2">
                      <p>Database is not available</p>
                      {error && (
                        <p className="text-xs opacity-75">{error}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="mt-2"
                      >
                        {isRetrying ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry Connection
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {status === "error" && (
                    <div className="space-y-2">
                      <p>Cannot connect to server</p>
                      {error && (
                        <p className="text-xs opacity-75">{error}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="mt-2"
                      >
                        {isRetrying ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}