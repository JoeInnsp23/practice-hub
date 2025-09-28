"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Building,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Edit,
  Archive,
  Trash2,
  FileText,
  DollarSign,
  Plus,
  Eye,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";

interface ClientDetailsProps {
  clientId: string;
}







export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch client from database using tRPC
  const { data: client, isLoading, error } = trpc.clients.getById.useQuery(clientId);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Client Details</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "The client you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/client-hub/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const },
      inactive: { label: "Inactive", variant: "secondary" as const },
      prospect: { label: "Prospect", variant: "outline" as const },
      archived: { label: "Archived", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      individual: "Individual",
      company: "Company",
      trust: "Trust",
      partnership: "Partnership",
    };
    return <Badge variant="secondary">{typeLabels[type as keyof typeof typeLabels]}</Badge>;
  };

  const getTaskStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      not_started: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="secondary" className={config?.className}>
        {config?.label}
      </Badge>
    );
  };

  const handleEdit = () => {
    toast.success("Edit functionality coming soon");
  };

  const handleArchive = () => {
    toast.success("Archive functionality coming soon");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      toast.success("Delete functionality coming soon");
      router.push("/client-hub/clients");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/client-hub/clients")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              {getTypeBadge(client.type)}
              {getStatusBadge(client.status)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="font-mono">{client.clientCode}</span>
              <span>•</span>
              <span>Managed by {client.accountManagerId || 'Unassigned'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleArchive} variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button onClick={handleDelete} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-12 w-full bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger
            value="overview"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Services
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="time"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Time Entries
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Unbilled Hours</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0/100</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.type === "company" && (
                  <>
                    {client.registrationNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Company Number</p>
                        <p className="font-medium">{client.registrationNumber}</p>
                      </div>
                    )}
                    {client.incorporationDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Incorporated</p>
                        <p className="font-medium">
                          {format(new Date(client.incorporationDate), "dd/MM/yyyy")}
                        </p>
                      </div>
                    )}
                    {client.yearEnd && (
                      <div>
                        <p className="text-sm text-muted-foreground">Year End</p>
                        <p className="font-medium">{client.yearEnd}</p>
                      </div>
                    )}
                    {client.vatNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">VAT Number</p>
                        <p className="font-medium">{client.vatNumber}</p>
                      </div>
                    )}
                  </>
                )}
                {(client.addressLine1 || client.city) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Registered Address</p>
                    <div className="space-y-1">
                      {client.addressLine1 && <p>{client.addressLine1}</p>}
                      {client.addressLine2 && <p>{client.addressLine2}</p>}
                      {client.city && <p>{client.city}</p>}
                      {client.state && <p>{client.state}</p>}
                      {client.postalCode && <p>{client.postalCode}</p>}
                      {client.country && <p>{client.country}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(client.email || client.phone) ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Details</p>
                      <p className="font-medium">{client.name}</p>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${client.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${client.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No contact information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent tasks found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Active Services
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No services configured</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                All Tasks
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks found for this client</p>
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          {/* Time Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0.0</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0.0</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Unbilled Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0.0</p>
                <p className="text-xs text-muted-foreground">To be invoiced</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries List */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Time Entries
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Time
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No time entries found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Invoices
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Document System Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Document management and storage will be available in a future update.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg text-left max-w-md mx-auto">
                  <h4 className="font-medium mb-2">Planned Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload and organize client documents</li>
                    <li>• Version control and history</li>
                    <li>• Secure document sharing</li>
                    <li>• Integration with client portal</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}