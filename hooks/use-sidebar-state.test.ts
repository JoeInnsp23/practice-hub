/* @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarState } from "./use-sidebar-state";

const KEY = "test:sidebar";

describe("useSidebarState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with defaults when storage empty", () => {
    const { result } = renderHook(() =>
      useSidebarState({ storageKey: KEY, defaultCollapsed: false }),
    );
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("reads initial state from localStorage when present", () => {
    localStorage.setItem(`${KEY}:collapsed`, "true");
    localStorage.setItem(`${KEY}:drawer`, "true");

    const { result } = renderHook(() => useSidebarState({ storageKey: KEY }));
    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("persists collapsed and drawer changes to localStorage", () => {
    const { result } = renderHook(() => useSidebarState({ storageKey: KEY }));

    act(() => {
      result.current.toggleCollapsed();
      result.current.openDrawer();
    });

    expect(localStorage.getItem(`${KEY}:collapsed`)).toBe("true");
    expect(localStorage.getItem(`${KEY}:drawer`)).toBe("true");

    act(() => {
      result.current.closeDrawer();
    });

    expect(localStorage.getItem(`${KEY}:drawer`)).toBe("false");
  });

  it("exposes imperative setters that update state", () => {
    const { result } = renderHook(() => useSidebarState({ storageKey: KEY }));

    act(() => {
      result.current.setIsCollapsed(true);
      result.current.setIsDrawerOpen(true);
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.isDrawerOpen).toBe(true);
  });
});

