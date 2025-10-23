"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/app/providers/trpc-provider";
import { toast } from "react-hot-toast";
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
import { Switch } from "@/components/ui/switch";

interface SortableWorkTypeItemProps {
  workType: any;
  onEdit: (workType: any) => void;
  onDelete: (id: string) => void;
}

function SortableWorkTypeItem({
  workType,
  onEdit,
  onDelete,
}: SortableWorkTypeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: workType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <Badge
          style={{ backgroundColor: workType.colorCode }}
          className="text-white font-medium"
        >
          {workType.label}
        </Badge>
        <code className="text-sm text-muted-foreground">{workType.code}</code>
        {workType.isBillable && (
          <Badge variant="outline" className="text-xs">
            Billable
          </Badge>
        )}
        {!workType.isActive && (
          <Badge variant="destructive" className="text-xs">
            Inactive
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(workType)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(workType.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function WorkTypesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkType, setEditingWorkType] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    colorCode: "#3b82f6",
    isBillable: true,
  });

  const { data, isLoading, refetch } = trpc.workTypes.list.useQuery({
    includeInactive: true,
  });

  const workTypes = data?.workTypes || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const createMutation = trpc.workTypes.create.useMutation({
    onSuccess: () => {
      toast.success("Work type created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create work type");
    },
  });

  const updateMutation = trpc.workTypes.update.useMutation({
    onSuccess: () => {
      toast.success("Work type updated successfully");
      setEditingWorkType(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update work type");
    },
  });

  const deleteMutation = trpc.workTypes.softDelete.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Work type deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete work type");
    },
  });

  const reorderMutation = trpc.workTypes.reorder.useMutation({
    onSuccess: () => {
      toast.success("Work types reordered");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder work types");
      refetch(); // Revert on error
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      label: "",
      colorCode: "#3b82f6",
      isBillable: true,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingWorkType) return;
    updateMutation.mutate({
      id: editingWorkType.id,
      label: formData.label,
      colorCode: formData.colorCode,
      isBillable: formData.isBillable,
      isActive: editingWorkType.isActive,
    });
  };

  const handleEdit = (workType: any) => {
    setEditingWorkType(workType);
    setFormData({
      code: workType.code,
      label: workType.label,
      colorCode: workType.colorCode,
      isBillable: workType.isBillable,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this work type?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = workTypes.findIndex((wt) => wt.id === active.id);
    const newIndex = workTypes.findIndex((wt) => wt.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new order
    const reordered = arrayMove(workTypes, oldIndex, newIndex);

    // Update sort orders
    const updates = reordered.map((wt, index) => ({
      id: wt.id,
      sortOrder: index + 1,
    }));

    reorderMutation.mutate(updates);
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Work Types
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage work type categories for time tracking
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Work Type
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Work Types</CardTitle>
              <CardDescription>
                Configure work type categories with custom colors and billing
                status. Drag to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading work types...
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={workTypes.map((wt) => wt.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {workTypes.map((workType) => (
                        <SortableWorkTypeItem
                          key={workType.id}
                          workType={workType}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Type</DialogTitle>
            <DialogDescription>
              Add a new work type category for time tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="WORK"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
              />
              <p className="text-sm text-muted-foreground">
                Uppercase letters and underscores only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="Work"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorCode">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="colorCode"
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) =>
                    setFormData({ ...formData, colorCode: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={formData.colorCode}
                  onChange={(e) =>
                    setFormData({ ...formData, colorCode: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isBillable"
                checked={formData.isBillable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isBillable: checked })
                }
              />
              <Label htmlFor="isBillable">Billable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingWorkType}
        onOpenChange={(open) => !open && setEditingWorkType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Type</DialogTitle>
            <DialogDescription>
              Update work type configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={formData.code} disabled />
              <p className="text-sm text-muted-foreground">
                Code cannot be changed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-colorCode">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-colorCode"
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) =>
                    setFormData({ ...formData, colorCode: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  value={formData.colorCode}
                  onChange={(e) =>
                    setFormData({ ...formData, colorCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isBillable"
                checked={formData.isBillable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isBillable: checked })
                }
              />
              <Label htmlFor="edit-isBillable">Billable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingWorkType(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
