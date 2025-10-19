"use client";

import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageViewProps {
  threadId: string;
  clientId: string;
}

export function MessageView({ threadId, clientId }: MessageViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch messages
  const { data: messages, isLoading } = trpc.clientPortal.listMessages.useQuery(
    {
      threadId,
      clientId,
      limit: 100,
      offset: 0,
    },
    {
      refetchInterval: 3000, // Poll every 3 seconds for new messages
    },
  );

  // Mark thread as read when viewing
  const markAsReadMutation = trpc.clientPortal.markThreadAsRead.useMutation();

  useEffect(() => {
    if (threadId && clientId) {
      markAsReadMutation.mutate({ threadId, clientId });
      // Invalidate thread list to update unread counts
      utils.clientPortal.listMyThreads.invalidate({ clientId });
    }
  }, [
    threadId,
    clientId,
    markAsReadMutation.mutate, // Invalidate thread list to update unread counts
    utils.clientPortal.listMyThreads.invalidate,
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {messages.map((item) => {
        // Determine sender info (staff or client portal user)
        const senderName =
          item.senderType === "staff" && item.staffSender
            ? `${item.staffSender.firstName} ${item.staffSender.lastName}`
            : item.senderType === "client_portal" && item.portalSender
              ? `${item.portalSender.firstName} ${item.portalSender.lastName}`
              : "Unknown";

        const _senderEmail =
          item.senderType === "staff" && item.staffSender
            ? item.staffSender.email
            : item.senderType === "client_portal" && item.portalSender
              ? item.portalSender.email
              : "";

        const senderImage =
          item.senderType === "staff" && item.staffSender
            ? item.staffSender.image
            : null;

        const initials = senderName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const isStaff = item.senderType === "staff";

        return (
          <div
            key={item.id}
            className={cn(
              "flex gap-3",
              !isStaff && "flex-row-reverse", // Client messages on right
            )}
          >
            {/* Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              {senderImage ? (
                <AvatarImage src={senderImage} alt={senderName} />
              ) : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>

            {/* Message Content */}
            <div
              className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                !isStaff && "items-end",
              )}
            >
              {/* Sender Name & Timestamp */}
              <div
                className={cn(
                  "flex items-center gap-2 text-xs",
                  !isStaff && "flex-row-reverse",
                )}
              >
                <span className="font-semibold">{senderName}</span>
                {isStaff && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                    Team
                  </span>
                )}
                <span className="text-muted-foreground">
                  {format(new Date(item.createdAt), "MMM d, h:mm a")}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "rounded-lg px-4 py-2",
                  isStaff
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {item.content}
                </p>
              </div>

              {/* Edited Indicator */}
              {item.isEdited && (
                <span className="text-xs text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
