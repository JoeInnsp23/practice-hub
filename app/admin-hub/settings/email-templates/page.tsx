"use client";

import { Eye, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

interface EmailTemplate {
  id: string;
  templateName: string;
  templateType: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateFormData {
  templateName: string;
  templateType: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
}

export default function EmailTemplatesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [selectedTemplateForTest, setSelectedTemplateForTest] =
    useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    templateName: "",
    templateType: "task_assigned",
    subject: "",
    bodyHtml: "",
    bodyText: "",
    isActive: true,
  });

  const { data, isLoading, refetch } = trpc.emailTemplates.list.useQuery({});
  const { data: templateTypesData } =
    trpc.emailTemplates.getTemplateTypes.useQuery();
  const { data: variablesData } =
    trpc.emailTemplates.getSupportedVariables.useQuery();

  const templates = data?.templates || [];
  const templateTypes = templateTypesData?.types || [];
  const supportedVariables = variablesData?.variables || [];

  const createMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Email template created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create email template");
    },
  });

  const updateMutation = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Email template updated successfully");
      setEditingTemplate(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update email template");
    },
  });

  const deleteMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Email template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete email template");
    },
  });

  const sendTestMutation = trpc.emailTemplates.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Test email sent successfully");
      setTestEmailDialogOpen(false);
      setTestRecipient("");
      setSelectedTemplateForTest(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test email");
    },
  });

  const previewMutation = trpc.emailTemplates.preview.useMutation({
    onSuccess: () => {
      // Preview data will be shown in dialog
      toast.success("Preview generated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate preview");
    },
  });

  const resetForm = () => {
    setFormData({
      templateName: "",
      templateType: "task_assigned",
      subject: "",
      bodyHtml: "",
      bodyText: "",
      isActive: true,
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      templateName: formData.templateName,
      templateType: formData.templateType as
        | "workflow_stage_complete"
        | "task_assigned"
        | "task_due_soon"
        | "task_overdue"
        | "client_created"
        | "client_status_changed",
      subject: formData.subject,
      bodyHtml: formData.bodyHtml,
      bodyText: formData.bodyText || undefined,
      isActive: formData.isActive,
    });
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      templateName: formData.templateName,
      templateType: formData.templateType as
        | "workflow_stage_complete"
        | "task_assigned"
        | "task_due_soon"
        | "task_overdue"
        | "client_created"
        | "client_status_changed",
      subject: formData.subject,
      bodyHtml: formData.bodyHtml,
      bodyText: formData.bodyText || undefined,
      isActive: formData.isActive,
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      templateType: template.templateType,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText || "",
      isActive: template.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this email template? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSelectedTemplateForTest(template);
    setTestEmailDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    previewMutation.mutate({
      id: template.id,
      bodyHtml: template.bodyHtml,
      subject: template.subject,
    });
  };

  const confirmSendTest = () => {
    if (!selectedTemplateForTest || !testRecipient) return;
    sendTestMutation.mutate({
      id: selectedTemplateForTest.id,
      recipientEmail: testRecipient,
    });
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Email Templates
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage automated email templates for workflow notifications
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Supported Variables Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>
                Use these placeholders in your email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {supportedVariables.map((variable) => (
                  <div
                    key={variable.name}
                    className="flex flex-col gap-1 p-3 border rounded-lg"
                  >
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {variable.placeholder}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      {variable.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Pre-configured email templates for automated notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading email templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No email templates found. Create your first template to get
                  started.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {template.templateName}
                          </h3>
                          <Badge variant="outline">
                            {
                              templateTypes.find(
                                (t) => t.value === template.templateType,
                              )?.label
                            }
                          </Badge>
                          {template.isActive ? (
                            <Badge className="bg-green-600 text-white">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last updated:{" "}
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(template)}
                          title="Preview template"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendTest(template)}
                          title="Send test email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new automated email template with variable placeholders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="Task Assignment Notification"
                value={formData.templateName}
                onChange={(e) =>
                  setFormData({ ...formData, templateName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateType">Template Type</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) =>
                  setFormData({ ...formData, templateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {
                  templateTypes.find((t) => t.value === formData.templateType)
                    ?.description
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="New task assigned: {task_name}"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyHtml">HTML Body</Label>
              <Textarea
                id="bodyHtml"
                placeholder="<p>Hi {staff_name},</p><p>You have been assigned a new task: {task_name}</p>"
                value={formData.bodyHtml}
                onChange={(e) =>
                  setFormData({ ...formData, bodyHtml: e.target.value })
                }
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Use variables like {"{client_name}"}, {"{task_name}"}, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyText">Plain Text Body (Optional)</Label>
              <Textarea
                id="bodyText"
                placeholder="Hi {staff_name}, You have been assigned a new task: {task_name}"
                value={formData.bodyText}
                onChange={(e) =>
                  setFormData({ ...formData, bodyText: e.target.value })
                }
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTemplate(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update email template configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-templateName">Template Name</Label>
              <Input
                id="edit-templateName"
                value={formData.templateName}
                onChange={(e) =>
                  setFormData({ ...formData, templateName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-templateType">Template Type</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) =>
                  setFormData({ ...formData, templateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Email Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bodyHtml">HTML Body</Label>
              <Textarea
                id="edit-bodyHtml"
                value={formData.bodyHtml}
                onChange={(e) =>
                  setFormData({ ...formData, bodyHtml: e.target.value })
                }
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bodyText">Plain Text Body (Optional)</Label>
              <Textarea
                id="edit-bodyText"
                value={formData.bodyText}
                onChange={(e) =>
                  setFormData({ ...formData, bodyText: e.target.value })
                }
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null);
                resetForm();
              }}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify the template rendering
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testRecipient">Recipient Email</Label>
              <Input
                id="testRecipient"
                type="email"
                placeholder="you@example.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Test email will use sample data for template variables
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailDialogOpen(false);
                setTestRecipient("");
                setSelectedTemplateForTest(null);
              }}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSendTest}
              disabled={sendTestMutation.isPending || !testRecipient}
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of {previewTemplate?.templateName} with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {previewMutation.data && (
              <>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {previewMutation.data.subject}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <div
                    className="p-4 bg-white dark:bg-slate-800 border rounded-lg"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Preview needs to render HTML
                    dangerouslySetInnerHTML={{
                      __html: previewMutation.data.bodyHtml,
                    }}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
