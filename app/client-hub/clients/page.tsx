"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/client-hub/clients/clients-table";
import { ClientFilters } from "@/components/client-hub/clients/client-filters";
import { ClientWizardModal } from "@/components/client-hub/clients/client-wizard-modal";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { Users, UserCheck, UserX, UserPlus, Plus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import toast from "react-hot-toast";

// Mock data for demonstration
const mockClients = [
  {
    id: "1",
    clientCode: "CLI001",
    name: "ABC Company Ltd",
    type: "company" as const,
    status: "active" as const,
    email: "contact@abccompany.com",
    phone: "+44 20 1234 5678",
    accountManager: "John Smith",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    clientCode: "CLI002",
    name: "John Doe",
    type: "individual" as const,
    status: "active" as const,
    email: "john.doe@email.com",
    phone: "+44 20 9876 5432",
    accountManager: "Jane Wilson",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    clientCode: "CLI003",
    name: "XYZ Partnership",
    type: "partnership" as const,
    status: "prospect" as const,
    email: "info@xyzpartnership.com",
    accountManager: "Bob Johnson",
    createdAt: new Date("2024-03-10"),
  },
  {
    id: "4",
    clientCode: "CLI004",
    name: "Smith Family Trust",
    type: "trust" as const,
    status: "active" as const,
    email: "trustees@smithtrust.com",
    phone: "+44 20 5555 1234",
    accountManager: "Alice Brown",
    createdAt: new Date("2024-03-25"),
  },
  {
    id: "5",
    clientCode: "CLI005",
    name: "Tech Innovations Ltd",
    type: "company" as const,
    status: "inactive" as const,
    email: "hello@techinnovations.com",
    accountManager: "John Smith",
    createdAt: new Date("2024-04-01"),
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients);
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
    // In a real app, this would navigate to client detail page
    toast.success(`Viewing ${client.name}`);
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

      {/* Filters and Table */}
      <div className="space-y-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Client List</h2>
          <ClientFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onReset={resetFilters}
          />
        </div>
        <ClientsTable
          clients={filteredClients}
          onView={handleViewClient}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
        />
      </div>

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
