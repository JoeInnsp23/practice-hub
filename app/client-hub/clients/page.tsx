"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientsTable } from "@/components/client-hub/clients/clients-table";
import { ClientWizardModal } from "@/components/client-hub/clients/client-wizard-modal";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { Users, UserCheck, UserX, UserPlus, Plus, Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter clients based on search and filters
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !debouncedSearchTerm ||
        client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.clientCode
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || client.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [clients, debouncedSearchTerm, typeFilter, statusFilter]);

  // Calculate KPIs
  const kpis = [
    {
      title: "Total Clients",
      value: clients.length.toString(),
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      title: "Active Clients",
      value: clients.filter((c) => c.status === "active").length.toString(),
      icon: UserCheck,
      iconColor: "text-green-600",
    },
    {
      title: "Prospects",
      value: clients.filter((c) => c.status === "prospect").length.toString(),
      icon: UserPlus,
      iconColor: "text-orange-600",
    },
    {
      title: "Inactive",
      value: clients.filter((c) => c.status === "inactive").length.toString(),
      icon: UserX,
      iconColor: "text-muted-foreground",
    },
  ];

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = (client: any) => {
    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      toast.success("Client deleted successfully");
    }
  };

  const handleSaveClient = (data: any) => {
    if (editingClient) {
      // Update existing client
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? { ...c, ...data, updatedAt: new Date() }
            : c,
        ),
      );
    } else {
      // Add new client
      const newClient = {
        ...data,
        id: (clients.length + 1).toString(),
        accountManager: "Current User",
        createdAt: new Date(),
      };
      setClients((prev) => [...prev, newClient]);
    }
    setIsModalOpen(false);
  };

  const handleViewClient = (client: any) => {
    router.push(`/client-hub/clients/${client.id}`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage your client relationships and information
          </p>
        </div>
        <Button onClick={handleAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      {/* Client List with Filters and Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, code, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Button */}
              {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetFilters}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <ClientsTable
            clients={filteredClients}
            onView={handleViewClient}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        </CardContent>
      </Card>

      {/* Client Wizard Modal */}
      <ClientWizardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
}
