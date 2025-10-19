"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { MessageInput } from "@/components/client-portal/messages/message-input";
import { MessageThreadList } from "@/components/client-portal/messages/message-thread-list";
import { MessageView } from "@/components/client-portal/messages/message-view";
import { Card, CardContent } from "@/components/ui/card";
import { useClientPortalContext } from "@/contexts/client-portal-context";

export default function MessagesPage() {
  const { currentClientId } = useClientPortalContext();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  if (!currentClientId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-card-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communicate with your accounting team
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Please select a client to view messages
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with your accounting team
        </p>
      </div>

      {/* Two-column layout: thread list + message view */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Thread List (Left Column) */}
        <div className="col-span-4">
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 flex-1 overflow-hidden">
              <MessageThreadList
                clientId={currentClientId}
                selectedThreadId={selectedThreadId}
                onThreadSelect={setSelectedThreadId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Message View + Input (Right Column) */}
        <div className="col-span-8">
          <Card className="h-full flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {selectedThreadId ? (
                <>
                  {/* Message View */}
                  <div className="flex-1 overflow-hidden">
                    <MessageView
                      threadId={selectedThreadId}
                      clientId={currentClientId}
                    />
                  </div>

                  {/* Message Input */}
                  <div className="border-t bg-card">
                    <MessageInput
                      threadId={selectedThreadId}
                      clientId={currentClientId}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-lg font-medium">
                      Select a conversation
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Choose a thread from the left to start messaging
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
