"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

// Common icons for portal links
const commonIcons = [
  "FileText", "Calculator", "Receipt", "Building2", "Users", "Settings",
  "Globe", "Mail", "Phone", "Calendar", "Clock", "ChevronRight",
  "ExternalLink", "Home", "Briefcase", "CreditCard", "DollarSign",
  "PoundSterling", "Euro", "TrendingUp", "BarChart", "PieChart",
  "FileSpreadsheet", "Database", "Shield", "Lock", "Key", "UserCheck",
  "Bell", "MessageSquare", "Info", "HelpCircle", "Book", "GraduationCap",
  "Clipboard", "Archive", "Folder", "FolderOpen", "File", "Files",
  "Download", "Upload", "Share2", "Link", "Link2", "Paperclip",
  "Send", "Check", "X", "Plus", "Minus", "Search", "Filter",
  "Eye", "EyeOff", "Edit", "Trash2", "RefreshCw", "RotateCw",
  "Server", "Cloud", "Cpu", "HardDrive", "Wifi", "Zap",
  "Star", "Heart", "ThumbsUp", "Award", "Trophy", "Target",
  "Flag", "MapPin", "Navigation", "Compass", "Map", "Route"
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get all available icon names
  const allIconNames = Object.keys(Icons).filter(
    (key) => key !== "default" && typeof (Icons as any)[key] === "function"
  );

  // Filter icons based on search or use common icons
  const filteredIcons = search
    ? allIconNames.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      )
    : commonIcons.filter((name) => allIconNames.includes(name));

  // Get the selected icon component
  const SelectedIcon = value && (Icons as any)[value] ? (Icons as any)[value] : Icons.FileText;

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
          <Icons.ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <div className="p-4 pb-2">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-[300px] px-4 pb-4">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((iconName) => {
                const IconComponent = (Icons as any)[iconName];
                if (!IconComponent) return null;

                return (
                  <Button
                    key={iconName}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 w-10 p-0",
                      value === iconName && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleSelect(iconName)}
                    title={iconName}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                );
              })
            ) : (
              <div className="col-span-6 text-center py-4 text-muted-foreground">
                No icons found
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}