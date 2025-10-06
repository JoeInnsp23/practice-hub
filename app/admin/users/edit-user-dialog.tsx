"use client";

import { Shield, User } from "lucide-react";
import { useState } from "react";
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

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EditUserDialogProps {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserData) => void;
}

export function EditUserDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: user.role,
    isActive: user.isActive,
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: (data) => {
      toast.success("User updated successfully");
      onSuccess(data.user);
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update user:", error);
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      id: user.id,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as "admin" | "member" | "client",
      },
    });
  };

  const loading = updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="editRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org:admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="org:accountant">Accountant</SelectItem>
                  <SelectItem value="org:member">Member</SelectItem>
                  {/* Support old format too */}
                  <SelectItem value="admin" className="hidden">
                    Admin (old)
                  </SelectItem>
                  <SelectItem value="accountant" className="hidden">
                    Accountant (old)
                  </SelectItem>
                  <SelectItem value="member" className="hidden">
                    Member (old)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="editActive" className="cursor-pointer">
                Active Status
              </Label>
              <Switch
                id="editActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
