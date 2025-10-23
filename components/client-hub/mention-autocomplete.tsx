"use client";

import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  extractUserIds,
  getMentionQuery,
  insertMention,
  isInMentionContext,
} from "@/lib/services/mention-parser";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onMention: (userId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MentionAutocomplete({
  value,
  onChange,
  onMention,
  placeholder = "Write a comment...",
  className,
  disabled = false,
}: MentionAutocompleteProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Query users for autocomplete
  const { data: users = [] } = trpc.tasks.getMentionableUsers.useQuery(
    { query: mentionQuery },
    {
      enabled: showDropdown && mentionQuery.length > 0,
      staleTime: 30000, // Cache for 30 seconds
    },
  );

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if we're in mention context
    if (isInMentionContext(newValue, newCursorPosition)) {
      const query = getMentionQuery(newValue, newCursorPosition);
      setMentionQuery(query);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
      setMentionQuery("");
    }
  };

  // Handle user selection
  const selectUser = (user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }) => {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    // Insert mention at cursor position
    const result = insertMention(value, cursorPosition, userName);

    onChange(result.text);
    onMention(user.id);
    setShowDropdown(false);
    setMentionQuery("");

    // Focus textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          result.cursorPosition,
          result.cursorPosition,
        );
      }
    }, 0);
  };

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || users.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        break;
      case "Enter":
        if (showDropdown) {
          e.preventDefault();
          selectUser(users[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setMentionQuery("");
        break;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="relative w-full">
      <Popover open={showDropdown && users.length > 0}>
        <PopoverTrigger asChild>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              className,
            )}
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-2"
          side="bottom"
          align="start"
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-1">
            {users.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              users.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    index === selectedIndex &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper text */}
      <div className="mt-1 text-xs text-muted-foreground">
        Type @ to mention a user
      </div>
    </div>
  );
}
