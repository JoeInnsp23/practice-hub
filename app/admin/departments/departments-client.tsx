"use client";

import { AlertCircle, Building2, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DepartmentModal from "./department-modal";
import DepartmentsTable from "./departments-table";

interface DepartmentsClientProps {
  tenantId: string;
}

export default function DepartmentsClient({
  tenantId,
}: DepartmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<{
    id: string;
    name: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
  } | null>(null);

  const { data, isLoading, error } = trpc.departments.list.useQuery({
    includeInactive: showInactive,
  });

  const filteredDepartments = useMemo(() => {
    if (!data?.departments) return [];

    return data.departments.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.managerName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [data?.departments, searchQuery]);

  const stats = useMemo(() => {
    if (!data?.departments) {
      return { total: 0, active: 0, inactive: 0, totalStaff: 0 };
    }

    const active = data.departments.filter((d) => d.isActive).length;
    const inactive = data.departments.filter((d) => !d.isActive).length;
    const totalStaff = data.departments.reduce(
      (sum, d) => sum + (d.staffCount || 0),
      0,
    );

    return {
      total: data.departments.length,
      active,
      inactive,
      totalStaff,
    };
  }, [data?.departments]);

  const handleCreate = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (department: {
    id: string;
    name: string;
    description: string | null;
    managerId: string | null;
    isActive: boolean;
  }) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load departments: {error.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Department Management</h1>
            <p className="text-muted-foreground mt-1">
              Organize staff into departments and assign managers
            </p>
          </div>
          <Button onClick={handleCreate} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Department
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Departments
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments by name, description, or manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="cursor-pointer">
                Show Inactive
              </Label>
            </div>
          </div>
        </Card>

        {/* Departments Table */}
        <DepartmentsTable
          departments={filteredDepartments}
          isLoading={isLoading}
          onEdit={handleEdit}
        />

        {/* Create/Edit Modal */}
        <DepartmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          department={editingDepartment}
        />
      </div>
    </div>
  );
}
