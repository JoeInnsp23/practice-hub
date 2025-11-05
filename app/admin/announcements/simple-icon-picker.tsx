"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Gift,
  Info,
  Megaphone,
  PartyPopper,
  Settings,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Predefined icon list for announcements
const ICON_OPTIONS = [
  { name: "Megaphone", Icon: Megaphone, label: "Megaphone" },
  { name: "AlertCircle", Icon: AlertCircle, label: "Alert" },
  { name: "AlertTriangle", Icon: AlertTriangle, label: "Warning" },
  { name: "Info", Icon: Info, label: "Info" },
  { name: "Calendar", Icon: Calendar, label: "Calendar" },
  { name: "PartyPopper", Icon: PartyPopper, label: "Party" },
  { name: "Gift", Icon: Gift, label: "Gift" },
  { name: "Wrench", Icon: Wrench, label: "Maintenance" },
  { name: "CheckCircle2", Icon: CheckCircle2, label: "Success" },
  { name: "Users", Icon: Users, label: "Team" },
  { name: "Zap", Icon: Zap, label: "Important" },
  { name: "Settings", Icon: Settings, label: "Settings" },
];

interface SimpleIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function SimpleIconPicker({ value, onChange }: SimpleIconPickerProps) {
  const selectedIcon = ICON_OPTIONS.find((opt) => opt.name === value);
  const SelectedIconComponent = selectedIcon?.Icon || Megaphone;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          type="button"
        >
          <SelectedIconComponent className="h-4 w-4" />
          <span>{selectedIcon?.label || "Select Icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="grid grid-cols-4 gap-2">
          {ICON_OPTIONS.map(({ name, Icon, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-accent transition-colors ${
                value === name
                  ? "bg-accent border-primary"
                  : "border-transparent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs text-center">{label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
