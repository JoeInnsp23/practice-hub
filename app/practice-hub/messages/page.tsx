"use client";

import {
  Hash,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  User,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ThreadType = "direct" | "team_channel" | "client";

interface Thread {
  id: string;
  type: ThreadType;
  name: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  sender: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
}

export default function MessagesPage() {
  const utils = trpc.useUtils();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const { data: threadsData } = trpc.messages.listThreads.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch messages for selected thread
  const { data: messagesData } = trpc.messages.listMessages.useQuery(
    { threadId: selectedThreadId!, limit: 100 },
    {
      enabled: !!selectedThreadId,
      refetchInterval: selectedThreadId ? 3000 : false, // Poll every 3 seconds when thread is selected
    }
  );

  // Fetch thread details
  const { data: threadDetails } = trpc.messages.getThread.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.messages.listMessages.invalidate({ threadId: selectedThreadId! });
      utils.messages.listThreads.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Mark thread as read
  const markAsReadMutation = trpc.messages.markAsRead.useMutation({
    onSuccess: () => {
      utils.messages.listThreads.invalidate();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData]);

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThreadId) {
      markAsReadMutation.mutate({ threadId: selectedThreadId });
    }
  }, [selectedThreadId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThreadId) return;

    sendMessageMutation.mutate({
      threadId: selectedThreadId,
      content: newMessage,
      type: "text",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const threads = threadsData || [];
  const messages = messagesData || [];

  // Filter threads by search
  const filteredThreads = threads.filter((thread: any) => {
    const threadName = getThreadDisplayName(thread);
    return threadName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Card className="h-full flex overflow-hidden">
        {/* Sidebar - Thread List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsNewChannelOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredThreads.map((thread: any) => (
                <ThreadItem
                  key={thread.thread.id}
                  thread={thread}
                  isSelected={selectedThreadId === thread.thread.id}
                  onClick={() => setSelectedThreadId(thread.thread.id)}
                />
              ))}

              {filteredThreads.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsNewDMOpen(true)}
                    className="mt-2"
                  >
                    Start a conversation
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* New DM Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsNewDMOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Direct Message
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThreadId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {threadDetails?.thread.type === "team_channel" ? (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <Avatar>
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {getThreadDisplayName(threadDetails)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {threadDetails?.participants.length || 0} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg: any) => (
                    <MessageBubble key={msg.message.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[60px] resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                <p className="text-sm">
                  Choose a conversation from the sidebar or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* New Channel Dialog */}
      <NewChannelDialog
        open={isNewChannelOpen}
        onOpenChange={setIsNewChannelOpen}
      />

      {/* New DM Dialog */}
      <NewDMDialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen} />
    </div>
  );
}

// Thread Item Component
function ThreadItem({
  thread,
  isSelected,
  onClick,
}: {
  thread: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const threadData = thread.thread;
  const unreadCount = thread.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-colors",
        "hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-start gap-3">
        {threadData.type === "team_channel" ? (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Hash className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <Avatar className="flex-shrink-0">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium truncate">
              {getThreadDisplayName(thread)}
            </span>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {thread.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {thread.lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: any }) {
  const msg = message.message;
  const sender = message.sender;

  return (
    <div className="flex items-start gap-3">
      <Avatar className="flex-shrink-0">
        <AvatarImage src={sender.image} />
        <AvatarFallback>
          {sender.firstName?.[0]}
          {sender.lastName?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm">
            {sender.firstName} {sender.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

// New Channel Dialog
function NewChannelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const createChannelMutation = trpc.messages.createChannel.useMutation({
    onSuccess: () => {
      toast.success("Channel created successfully");
      utils.messages.listThreads.invalidate();
      onOpenChange(false);
      setName("");
      setDescription("");
      setIsPrivate(false);
    },
    onError: (error) => {
      toast.error(`Failed to create channel: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createChannelMutation.mutate({
      name,
      description: description || undefined,
      isPrivate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. They're best organized
            around a topic — #tax-team, for example.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Channel name</label>
            <Input
              placeholder="e.g. tax-team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description (optional)
            </label>
            <Textarea
              placeholder="What's this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="private" className="text-sm">
              Make private (only invited members can access)
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createChannelMutation.isPending}>
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// New DM Dialog
function NewDMDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch users for DM selection
  const { data: usersData } = trpc.users.list.useQuery({});

  const createDMMutation = trpc.messages.createDirectMessage.useMutation({
    onSuccess: () => {
      toast.success("Direct message created");
      utils.messages.listThreads.invalidate();
      onOpenChange(false);
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(`Failed to create DM: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    createDMMutation.mutate({
      participantIds: [selectedUserId],
    });
  };

  const users = usersData?.users || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Direct Message</DialogTitle>
          <DialogDescription>
            Send a message directly to a team member
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select a user</label>
            <ScrollArea className="h-64 border rounded-lg p-2">
              <div className="space-y-1">
                {users.map((user: any) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors hover:bg-muted",
                      selectedUserId === user.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image} />
                        <AvatarFallback>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId || createDMMutation.isPending}
            >
              Start Conversation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get thread display name
function getThreadDisplayName(thread: any): string {
  if (!thread) return "Unknown";

  const threadData = thread.thread || thread;

  if (threadData.type === "team_channel") {
    return `#${threadData.name || "channel"}`;
  }

  if (threadData.type === "client" && thread.client) {
    return thread.client.companyName || "Client";
  }

  // For direct messages, show other participants
  if (thread.participants) {
    const names = thread.participants
      .map((p: any) => `${p.user.firstName} ${p.user.lastName}`)
      .join(", ");
    return names || "Direct Message";
  }

  return threadData.name || "Conversation";
}
