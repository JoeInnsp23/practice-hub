"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconRegistry, getIconNames, getIconByName, commonIconNames } from "./icon-registry";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get all available icon names
  const allIconNames = getIconNames();

  // Filter icons based on search, or show common icons if no search
  const filteredIcons = search.trim()
    ? allIconNames.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase().trim())
      )
    : commonIconNames.filter((name) => iconRegistry[name]);

  // Get the selected icon component
  const SelectedIcon = value ? getIconByName(value) || FileText : FileText;

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

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
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="flex flex-col max-h-[400px]">
          <div className="p-4 pb-2 space-y-2 border-b">
            <Input
              placeholder="Search all icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
            {!search && (
              <p className="text-xs text-muted-foreground">
                Showing common icons. Type to search all {allIconNames.length} available icons.
              </p>
            )}
          </div>
          <div className="overflow-y-auto max-h-[300px] p-4">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((iconName) => {
                  const IconComponent = getIconByName(iconName);
                  if (!IconComponent) return null;

                  return (
                    <Button
                      key={iconName}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0",
                        value === iconName && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => handleSelect(iconName)}
                      title={iconName}
                      type="button"
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })
              ) : (
                <div className="col-span-6 text-center py-4 text-muted-foreground">
                  {search ? "No icons found matching your search" : "No icons available"}
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}