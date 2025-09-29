"use client";

import { Bug, Lightbulb, MessageCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getRecentConsoleLogs } from "@/lib/console-capture";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [loading, setLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState("issue");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Capture console logs if it's an issue
      let consoleLogs: string | undefined;
      if (feedbackType === "issue" && typeof window !== "undefined") {
        consoleLogs = getRecentConsoleLogs(20);
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: feedbackType,
          consoleLogs,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast.success("Thank you for your feedback!");
      onClose();

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
      });
      setFeedbackType("issue");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const _getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return <Bug className="h-4 w-4" />;
      case "feature":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Practice Hub by reporting issues or suggesting
              features
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs value={feedbackType} onValueChange={setFeedbackType}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="issue">
                  <Bug className="h-4 w-4 mr-2" />
                  Issue
                </TabsTrigger>
                <TabsTrigger value="feature_request">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Feature
                </TabsTrigger>
                <TabsTrigger value="general">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
              </TabsList>

              <div className="space-y-4 mt-4">
                {/* Title */}
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Brief description of your feedback"
                    required
                  />
                </div>

                {/* Category */}
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ui">User Interface</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="functionality">
                        Functionality
                      </SelectItem>
                      <SelectItem value="data">Data/Reports</SelectItem>
                      <SelectItem value="integration">Integrations</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority (for issues only) */}
                {feedbackType === "issue" && (
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger id="priority">
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
                )}

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={
                      feedbackType === "issue"
                        ? "Describe the issue you encountered..."
                        : feedbackType === "feature_request"
                          ? "Describe the feature you would like to see..."
                          : "Share your feedback..."
                    }
                    rows={4}
                    required
                  />
                </div>

                {/* Info Alert for Issues */}
                {feedbackType === "issue" && (
                  <Alert>
                    <AlertDescription>
                      Browser information and page details will be automatically
                      included to help us diagnose the issue.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
