"use client";

import { FileText, Plus, Search, Star } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateEditor } from "./template-editor";

export function TemplateList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const { data, isLoading, refetch } = trpc.proposalTemplates.list.useQuery({
    category,
    search,
  });

  const { mutate: deleteTemplate } =
    trpc.proposalTemplates.delete.useMutation({
      onSuccess: () => {
        toast.success("Template deleted");
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete template");
      },
    });

  const { mutate: setDefault } =
    trpc.proposalTemplates.setDefault.useMutation({
      onSuccess: () => {
        toast.success("Default template updated");
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to set default");
      },
    });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingId(undefined);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingId(undefined);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proposal Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage templates to prefill proposals
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="small-business">Small Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Template Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading templates...</div>
      ) : data?.templates.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.templates.map((template) => (
            <Card key={template.id} className="glass-card p-6 relative">
              {template.isDefault && (
                <div className="absolute top-4 right-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {template.category && (
                  <div className="text-sm">
                    <span className="font-medium">Category:</span>{" "}
                    <span className="text-muted-foreground capitalize">
                      {template.category.replace("-", " ")}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Services:</span>{" "}
                  <span className="text-muted-foreground">
                    {Array.isArray(template.defaultServices)
                      ? template.defaultServices.length
                      : 0}{" "}
                    selected
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(template.id)}
                >
                  Edit
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefault(template.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this template?")) {
                      deleteTemplate(template.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <TemplateEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        templateId={editingId}
      />
    </div>
  );
}
