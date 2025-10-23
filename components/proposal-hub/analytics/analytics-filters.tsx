"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  assignedToId?: string;
  clientId?: string;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: Dispatch<SetStateAction<AnalyticsFilters>>;
  users?: Array<{ id: string; name: string }>;
  clients?: Array<{ id: string; name: string }>;
}

export function AnalyticsFiltersComponent({
  filters,
  onFiltersChange,
  users = [],
  clients = [],
}: AnalyticsFiltersProps) {
  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.assignedToId ||
    filters.clientId;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
          <span className="text-sm font-medium text-foreground">Filters:</span>

          {/* Date Range */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) =>
                    onFiltersChange((prev) => ({ ...prev, dateFrom: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PPP") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) =>
                    onFiltersChange((prev) => ({ ...prev, dateTo: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Assignee Filter */}
          {users.length > 0 && (
            <Select
              value={filters.assignedToId || "all"}
              onValueChange={(value) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  assignedToId: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Client Filter */}
          {clients.length > 0 && (
            <Select
              value={filters.clientId || "all"}
              onValueChange={(value) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  clientId: value === "all" ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
