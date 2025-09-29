"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllIconNames,
  getCommonIconNames,
  fuzzySearchIcons,
  getIconComponent,
} from "./icon-utils";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get all available icon names (memoized for performance)
  const allIconNames = useMemo(() => getAllIconNames(), []);
  const commonIconNames = useMemo(() => getCommonIconNames(), []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      // Use fuzzy search for better results
      const results = fuzzySearchIcons(search, allIconNames);
      // Limit to 100 results for performance
      return results.slice(0, 100);
    } else {
      // Show common icons when not searching
      return commonIconNames;
    }
  }, [search, allIconNames, commonIconNames]);

  // Get the selected icon component
  const SelectedIcon = value ? getIconComponent(value) || FileText : FileText;

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

  // Calculate if we should show scroll indicators
  const hasMoreIcons = filteredIcons.length > 30; // ~5 rows of 6 icons

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start"
        >
          <SelectedIcon className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">
            {value || "Select an icon..."}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="flex flex-col">
          {/* Fixed header with search */}
          <div className="p-4 pb-3 border-b space-y-2">
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
                  <>Found {filteredIcons.length} icons</>
                ) : (
                  <>Showing popular icons</>
                )}
              </span>
              <span>{allIconNames.length} total icons available</span>
            </div>
          </div>

          {/* Scrollable icon grid with reduced height */}
          <div
            className="overflow-y-auto p-4"
            style={{
              maxHeight: "240px", // Reduced from 300px to ensure scrolling
              scrollbarWidth: "thin" // For Firefox
            }}
          >
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = getIconComponent(iconName);
                  if (!IconComponent) return null;

                  return (
                    <Button
                      key={iconName}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0 transition-all",
                        value === iconName &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground ring-2 ring-primary"
                      )}
                      onClick={() => handleSelect(iconName)}
                      title={iconName}
                      type="button"
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No icons found</p>
                <p className="text-xs mt-2">Try searching for something else</p>
              </div>
            )}

            {/* Scroll indicator */}
            {hasMoreIcons && (
              <div className="text-center mt-4 text-xs text-muted-foreground">
                <p>↓ Scroll for more icons ↓</p>
              </div>
            )}
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          /* Webkit browsers (Chrome, Safari, Edge) */
          :global(.overflow-y-auto::-webkit-scrollbar) {
            width: 8px;
          }
          :global(.overflow-y-auto::-webkit-scrollbar-track) {
            background: hsl(var(--muted));
            border-radius: 4px;
          }
          :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
          }
          :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
            background: hsl(var(--muted-foreground) / 0.5);
          }
        `}</style>
      </PopoverContent>
    </Popover>
  );
}