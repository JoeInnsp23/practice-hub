"use client";

import { Building2, Edit, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Department {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  managerName: string | null;
  staffCount: number;
  isActive: boolean;
}

interface DepartmentsTableProps {
  departments: Department[];
  isLoading: boolean;
  onEdit: (department: {
    id: string;
    name: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
  }) => void;
}

export default function DepartmentsTable({
  departments,
  isLoading,
  onEdit,
}: DepartmentsTableProps) {
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const utils = trpc.useUtils();
  const deleteMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Department deleted successfully");
      utils.departments.list.invalidate();
      setDeletingDepartment(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (!deletingDepartment) return;
    deleteMutation.mutate(deletingDepartment.id);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  if (departments.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Departments Found</h3>
          <p className="text-muted-foreground max-w-md">
            Get started by creating your first department to organize your
            staff.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-md">Department Name</TableHead>
              <TableHead className="whitespace-nowrap">Manager</TableHead>
              <TableHead className="whitespace-nowrap">Staff Count</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="max-w-md">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{department.name}</p>
                    {department.description && (
                      <p className="text-sm text-muted-foreground break-words">
                        {department.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {department.managerName ? (
                    <span className="text-sm">{department.managerName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{department.staffCount}</span>
                    <span className="text-sm text-muted-foreground">
                      {department.staffCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {department.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onEdit({
                            id: department.id,
                            name: department.name,
                            description: department.description,
                            managerId: department.managerId,
                            isActive: department.isActive,
                          })
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingDepartment(department)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <span className="font-semibold">{deletingDepartment?.name}</span>{" "}
              department?
              {deletingDepartment && deletingDepartment.staffCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This department has {deletingDepartment.staffCount}{" "}
                  active staff{" "}
                  {deletingDepartment.staffCount === 1 ? "member" : "members"}.
                  Please reassign staff before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
