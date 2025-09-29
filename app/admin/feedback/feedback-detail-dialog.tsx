"use client";

import {
  Bug,
  FileText,
  Globe,
  Lightbulb,
  MessageSquare,
  Terminal,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  userRole: string | null;
  type: string;
  title: string;
  description: string;
  category: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  consoleLogs: string | null;
  status: string | null;
  priority: string | null;
  adminNotes: string | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackDetailDialogProps {
  feedback: Feedback;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (feedbackId: string, newStatus: string) => void;
}

export function FeedbackDetailDialog({
  feedback,
  isOpen,
  onClose,
  onStatusUpdate,
}: FeedbackDetailDialogProps) {
  const [status, setStatus] = useState(feedback.status || "new");
  const [priority, setPriority] = useState(feedback.priority || "medium");
  const [adminNotes, setAdminNotes] = useState(feedback.adminNotes || "");
  const [resolution, setResolution] = useState(feedback.resolution || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          adminNotes,
          resolution,
          resolvedAt: status === "resolved" ? new Date() : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update feedback");
      }

      onStatusUpdate(feedback.id, status);
      onClose();
    } catch (error) {
      console.error("Failed to update feedback:", error);
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return <Bug className="h-4 w-4" />;
      case "feature_request":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(feedback.type)}
            {feedback.title}
          </DialogTitle>
          <DialogDescription>
            Submitted by {feedback.userName || feedback.userEmail} on{" "}
            {new Date(feedback.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="technical">Technical Info</TabsTrigger>
            <TabsTrigger value="admin">Admin Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="wont_fix">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback.description}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>
                    <strong>Email:</strong> {feedback.userEmail}
                  </div>
                  <div>
                    <strong>Name:</strong> {feedback.userName || "N/A"}
                  </div>
                  <div>
                    <strong>Role:</strong> {feedback.userRole || "N/A"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Feedback Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>
                    <strong>Type:</strong> {feedback.type.replace("_", " ")}
                  </div>
                  <div>
                    <strong>Category:</strong> {feedback.category || "N/A"}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4 mt-4">
            {feedback.pageUrl && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Page URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={feedback.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {feedback.pageUrl}
                  </a>
                </CardContent>
              </Card>
            )}

            {feedback.consoleLogs && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Console Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {feedback.consoleLogs}
                  </pre>
                </CardContent>
              </Card>
            )}

            {feedback.userAgent && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">User Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {feedback.userAgent}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="admin" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this feedback..."
                rows={4}
              />
            </div>

            {(status === "resolved" || status === "wont_fix") && (
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this was resolved..."
                  rows={4}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
