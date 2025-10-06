// Console capture utility for capturing browser logs when reporting issues

interface ConsoleLog {
  type: "log" | "error" | "warn" | "info" | "debug";
  message: string;
  timestamp: string;
  stack?: string;
}

class ConsoleCapture {
  private logs: ConsoleLog[] = [];
  private maxLogs: number = 100;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };
  private isCapturing: boolean = false;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  start() {
    if (this.isCapturing || typeof window === "undefined") return;

    this.isCapturing = true;

    // Override console methods to capture logs
    console.log = this.captureLog("log");
    console.error = this.captureLog("error");
    console.warn = this.captureLog("warn");
    console.info = this.captureLog("info");
    console.debug = this.captureLog("debug");
  }

  stop() {
    if (!this.isCapturing) return;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    this.isCapturing = false;
  }

  private captureLog(type: ConsoleLog["type"]) {
    return (...args: unknown[]) => {
      // Call original console method
      this.originalConsole[type](...args);

      // Capture the log
      const log: ConsoleLog = {
        type,
        message: args
          .map((arg) => {
            if (typeof arg === "object") {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(" "),
        timestamp: new Date().toISOString(),
      };

      // Capture stack trace for errors
      if (type === "error" && args[0] instanceof Error) {
        log.stack = args[0].stack;
      }

      this.logs.push(log);

      // Keep only the most recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    };
  }

  getRecentLogs(count?: number): string {
    const logsToReturn = count ? this.logs.slice(-count) : this.logs;

    return logsToReturn
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const prefix = `[${time}] [${log.type.toUpperCase()}]`;
        const message = log.stack || log.message;
        return `${prefix} ${message}`;
      })
      .join("\n");
  }

  clearLogs() {
    this.logs = [];
  }
}

// Create singleton instance
let consoleCapture: ConsoleCapture | null = null;

export function initConsoleCapture() {
  if (typeof window === "undefined") return;

  if (!consoleCapture) {
    consoleCapture = new ConsoleCapture();
    consoleCapture.start();
  }
}

export function getRecentConsoleLogs(count?: number): string {
  if (!consoleCapture) {
    return "Console capture not initialized";
  }
  return consoleCapture.getRecentLogs(count);
}

export function clearConsoleLogs() {
  if (consoleCapture) {
    consoleCapture.clearLogs();
  }
}

// Auto-initialize in browser
if (typeof window !== "undefined") {
  initConsoleCapture();
}
