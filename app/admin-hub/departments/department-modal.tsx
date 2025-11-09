"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: {
    id: string;
    name: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
  } | null;
}

export default function DepartmentModal({
  isOpen,
  onClose,
  department,
}: DepartmentModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const utils = trpc.useUtils();
  const isEditing = !!department;

  // Fetch eligible managers (admin + accountant roles)
  const { data: usersData } = trpc.users.list.useQuery({});

  const eligibleManagers =
    usersData?.users?.filter(
      (user) => user.role === "admin" || user.role === "accountant",
    ) || [];

  const createMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Department created successfully");
      utils.departments.list.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Department updated successfully");
      utils.departments.list.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      if (department) {
        setName(department.name);
        setDescription(department.description || "");
        setManagerId(department.managerId || "");
        setIsActive(department.isActive);
      } else {
        setName("");
        setDescription("");
        setManagerId("");
        setIsActive(true);
      }
    }
  }, [isOpen, department]);

  const handleClose = () => {
    setName("");
    setDescription("");
    setManagerId("");
    setIsActive(true);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }

    if (isEditing) {
      updateMutation.mutate({
        id: department.id,
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId || undefined,
        isActive,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId || undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Department" : "Create Department"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the department details below."
                : "Create a new department to organize your staff."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Department Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Tax, Audit, Advisory"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the department's responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager</Label>
              <Select
                value={managerId}
                onValueChange={setManagerId}
                disabled={isPending}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select a manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Manager</SelectItem>
                  {eligibleManagers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only admin and accountant roles can be department managers
              </p>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isPending}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active Department
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Department"
                  : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
