"use client";

import { ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fuzzySearchIcons,
  getAllIconNames,
  getCommonIconNames,
  getIconComponent,
} from "./icon-utils";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Get all available icon names (memoized for performance)
  const allIconNames = useMemo(() => getAllIconNames(), []);
  const commonIconNames = useMemo(() => getCommonIconNames(), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter icons based on debounced search
  const filteredIcons = useMemo(() => {
    if (debouncedSearch.trim()) {
      // Use fuzzy search across all icons
      return fuzzySearchIcons(debouncedSearch, allIconNames).slice(0, 100);
    } else {
      // Show common icons when not searching
      return commonIconNames;
    }
  }, [debouncedSearch, commonIconNames, allIconNames]);

  // Get the selected icon component
  const SelectedIcon = value ? getIconComponent(value) || FileText : FileText;

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className="h-4 w-4" />
          <span>{value || "Select an icon..."}</span>
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              className="p-1 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
              onClick={handleClear}
              aria-label="Clear icon selection"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 opacity-50" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </Button>

      {/* Inline Expandable Panel */}
      {isOpen && (
        <div className="border rounded-lg p-4 space-y-3 bg-background">
          {/* Search Input */}
          <div className="space-y-2">
            <Input
              placeholder="Search icons (try 'document', 'time', 'mail')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {search ? (
                  search !== debouncedSearch ? (
                    "Searching..."
                  ) : (
                    <>Found {filteredIcons.length} icons</>
                  )
                ) : (
                  "Showing popular icons"
                )}
              </span>
              <span>{allIconNames.length} total available</span>
            </div>
          </div>

          {/* Scrollable Icon Grid */}
          <div
            className="overflow-y-auto border rounded-md p-3 bg-muted/30"
            style={{
              height: "200px",
              scrollbarGutter: "stable",
            }}
          >
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = getIconComponent(iconName);
                  if (!IconComponent) return null;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      className={cn(
                        "h-10 w-10 rounded border bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center flex-shrink-0",
                        value === iconName &&
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground border-primary",
                      )}
                      onClick={() => handleSelect(iconName)}
                      title={iconName}
                    >
                      <IconComponent className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No icons found</p>
                <p className="text-xs mt-2">Try searching for something else</p>
              </div>
            )}
          </div>

          {/* Helper Text */}
          {filteredIcons.length > 40 && (
            <p className="text-xs text-center text-muted-foreground">
              Scroll to see more icons
            </p>
          )}
        </div>
      )}
    </div>
  );
}
