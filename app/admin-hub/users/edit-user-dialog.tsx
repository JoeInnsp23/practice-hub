"use client";

import * as Sentry from "@sentry/nextjs";
import { Shield, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  departmentId: string | null;
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
    departmentId: user.departmentId || "none",
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = trpc.departments.list.useQuery({
    includeInactive: false,
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: (data) => {
      toast.success("User updated successfully");
      onSuccess(data.user as UserData);
      onClose();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "update_user", component: "EditUserDialog" },
      });
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
        departmentId:
          formData.departmentId === "none" ? null : formData.departmentId,
      },
    });
  };

  const loading = updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Edit User</DialogTitle>
        <DialogDescription className="sr-only">
          Update user details and permissions
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit User
              </CardTitle>
              <CardDescription>
                Update user details and permissions
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8 md:px-10">
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
                  <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: value })
                  }
                >
                  <SelectTrigger id="editDepartment">
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent className={GLASS_DROPDOWN_MENU_STYLES}>
                    <SelectItem value="none">No Department</SelectItem>
                    {departmentsData?.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
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
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
