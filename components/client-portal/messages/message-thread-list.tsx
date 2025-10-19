"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MessageThreadListProps {
  clientId: string;
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export function MessageThreadList({
  clientId,
  selectedThreadId,
  onThreadSelect,
}: MessageThreadListProps) {
  // Fetch threads for this client
  const { data: threads, isLoading } = trpc.clientPortal.listMyThreads.useQuery(
    { clientId },
    {
      refetchInterval: 3000, // Poll every 3 seconds for new messages
    },
  );

  // Auto-select first thread if none selected
  useEffect(() => {
    if (threads && threads.length > 0 && !selectedThreadId) {
      onThreadSelect(threads[0].thread.id);
    }
  }, [threads, selectedThreadId, onThreadSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50 animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Your accounting team will reach out to you here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Conversations
        </h3>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads.map((item) => {
          const isSelected = selectedThreadId === item.thread.id;
          const hasUnread = item.unreadCount > 0;

          return (
            <button
              key={item.thread.id}
              type="button"
              onClick={() => onThreadSelect(item.thread.id)}
              className={cn(
                "w-full px-4 py-3 border-b hover:bg-muted/50 transition-colors text-left",
                isSelected && "bg-muted",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Thread Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={cn(
                        "font-medium text-sm truncate",
                        hasUnread && "font-bold",
                      )}
                    >
                      {item.thread.name || "Conversation"}
                    </h4>
                  </div>

                  {/* Last Message Preview */}
                  {item.lastMessage && (
                    <p
                      className={cn(
                        "text-sm text-muted-foreground truncate",
                        hasUnread && "font-semibold text-foreground",
                      )}
                    >
                      {item.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Timestamp & Unread Badge */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {item.lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(item.lastMessage.createdAt),
                        {
                          addSuffix: false,
                        },
                      )}
                    </span>
                  )}
                  {hasUnread && (
                    <Badge
                      variant="default"
                      className="h-5 min-w-[20px] px-1.5 flex items-center justify-center"
                    >
                      {item.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
