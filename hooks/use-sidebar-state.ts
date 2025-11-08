import { useCallback, useEffect, useState } from "react";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readBoolean(key: string, fallback: boolean): boolean {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function writeBoolean(key: string, value: boolean): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore storage errors
  }
}

export interface UseSidebarStateOptions {
  storageKey?: string;
  defaultCollapsed?: boolean;
}

export function useSidebarState(options: UseSidebarStateOptions = {}) {
  const storageKey = options.storageKey ?? "ph:sidebar";
  const defaultCollapsed = options.defaultCollapsed ?? false;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() =>
    readBoolean(`${storageKey}:collapsed`, defaultCollapsed),
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() =>
    readBoolean(`${storageKey}:drawer`, false),
  );

  // Persist changes
  useEffect(() => {
    writeBoolean(`${storageKey}:collapsed`, isCollapsed);
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    writeBoolean(`${storageKey}:drawer`, isDrawerOpen);
  }, [isDrawerOpen, storageKey]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    isDrawerOpen,
    setIsDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  } as const;
}
