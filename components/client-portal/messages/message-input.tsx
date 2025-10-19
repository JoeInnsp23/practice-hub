"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  threadId: string;
  clientId: string;
}

export function MessageInput({ threadId, clientId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const sendMessageMutation = trpc.clientPortal.sendMessage.useMutation({
    onSuccess: () => {
      // Clear input
      setContent("");

      // Invalidate queries to refresh messages and thread list
      utils.clientPortal.listMessages.invalidate({ threadId, clientId });
      utils.clientPortal.listMyThreads.invalidate({ clientId });

      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSend = () => {
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }

    sendMessageMutation.mutate({
      threadId,
      clientId,
      content: content.trim(),
      type: "text",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sendMessageMutation.isPending}
          className="resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={sendMessageMutation.isPending || !content.trim()}
          size="icon"
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Your messages are sent directly to your accounting team
      </p>
    </div>
  );
}
