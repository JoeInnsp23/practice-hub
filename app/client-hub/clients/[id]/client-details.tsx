"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  Archive,
  Building,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientDetailsProps {
  clientId: string;
}

// Helper function to parse full name into parts
function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], middle: "", last: "" };
  }
  if (parts.length === 2) {
    return { first: parts[0], middle: "", last: parts[1] };
  }
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);
  const [editedContact, setEditedContact] = useState<any>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactPrePopulationSource, setContactPrePopulationSource] =
    useState("manual");

  // Dialog state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch client from database using tRPC
  const {
    data: client,
    isLoading,
    error,
  } = trpc.clients.getById.useQuery(clientId);

  // Fetch client services
  const { data: servicesData, isLoading: servicesLoading } =
    trpc.clients.getClientServices.useQuery(clientId);

  // Fetch tasks for this client
  const { data: tasksData, isLoading: tasksLoading } = trpc.tasks.list.useQuery(
    { clientId },
  );

  // Fetch time entries for this client
  const { data: timeEntriesData, isLoading: timeEntriesLoading } =
    trpc.timesheets.list.useQuery({ clientId });

  // Fetch invoices for this client
  const { data: invoicesData, isLoading: invoicesLoading } =
    trpc.invoices.list.useQuery({ clientId });

  // Fetch contacts for this client
  const { data: contactsData, isLoading: contactsLoading } =
    trpc.clients.getClientContacts.useQuery(clientId);

  // Fetch directors for this client
  const { data: directorsData, isLoading: directorsLoading } =
    trpc.clients.getClientDirectors.useQuery(clientId);

  // Fetch PSCs for this client
  const { data: pscsData, isLoading: pscsLoading } =
    trpc.clients.getClientPSCs.useQuery(clientId);

  // Fetch users for account manager dropdown
  const { data: usersData } = trpc.users.list.useQuery({});

  // Mutations
  const utils = trpc.useUtils();
  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.getById.invalidate(clientId);
      toast.success("Client updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const updateContactMutation = trpc.clients.updateContact.useMutation({
    onSuccess: () => {
      utils.clients.getClientContacts.invalidate(clientId);
      toast.success("Contact updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const deleteClientMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client archived successfully");
      router.push("/client-hub/clients");
    },
    onError: (error) => {
      toast.error(`Failed to archive client: ${error.message}`);
    },
  });

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
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      individual: "Individual",
      company: "Company",
      trust: "Trust",
      partnership: "Partnership",
    };
    return (
      <Badge variant="secondary">
        {typeLabels[type as keyof typeof typeLabels]}
      </Badge>
    );
  };

  const _getTaskStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800",
      },
      in_progress: {
        label: "In Progress",
        className: "bg-blue-100 text-blue-800",
      },
      not_started: {
        label: "Not Started",
        className: "bg-gray-100 text-gray-800",
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="secondary" className={config?.className}>
        {config?.label}
      </Badge>
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save client changes
      if (editedClient) {
        await updateClientMutation.mutateAsync({
          id: clientId,
          data: {
            name: editedClient.name,
            status: editedClient.status,
            accountManagerId: editedClient.accountManagerId,
          },
        });
      }

      // Save contact changes if editing
      if (isEditingContact && editedContact) {
        await updateContactMutation.mutateAsync({
          id: editedContact.id,
          data: {
            firstName: editedContact.firstName,
            middleName: editedContact.middleName,
            lastName: editedContact.lastName,
            email: editedContact.email,
            phone: editedContact.phone,
            jobTitle: editedContact.jobTitle,
            isPrimary: editedContact.isPrimary,
            addressLine1: editedContact.addressLine1,
            addressLine2: editedContact.addressLine2,
            city: editedContact.city,
            region: editedContact.region,
            postalCode: editedContact.postalCode,
            country: editedContact.country,
          },
        });
      }

      // Reset all editing states
      setIsEditing(false);
      setEditedClient(null);
      setIsEditingContact(false);
      setEditedContact(null);
      setContactPrePopulationSource("manual");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedClient(null);
    setIsEditingContact(false);
    setEditedContact(null);
    setContactPrePopulationSource("manual");
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedClient({ ...client });
    // Automatically enable contact editing for first contact
    if (contactsData?.contacts && contactsData.contacts.length > 0) {
      setEditedContact({ ...contactsData.contacts[0] });
      setIsEditingContact(true);
    }
  };

  const handleArchive = () => {
    setShowArchiveDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmArchive = async () => {
    await deleteClientMutation.mutateAsync(clientId);
    setShowArchiveDialog(false);
  };

  const handleConfirmDelete = async () => {
    await deleteClientMutation.mutateAsync(clientId);
    setShowDeleteDialog(false);
  };

  // Calculate metrics
  const clientServices = servicesData?.services || [];
  const clientTasks = tasksData?.tasks || [];
  const clientTimeEntries = timeEntriesData?.timeEntries || [];
  const clientInvoices = invoicesData?.invoices || [];

  const activeTasks = clientTasks.filter(
    (t) =>
      t.status === "in_progress" ||
      t.status === "pending" ||
      t.status === "review",
  ).length;

  const overdueTasks = clientTasks.filter(
    (t) =>
      (t.status === "in_progress" || t.status === "pending") &&
      t.targetDate &&
      new Date(t.targetDate) < new Date(),
  ).length;

  const unbilledHours = clientTimeEntries
    .filter((entry) => entry.billable && !entry.billed)
    .reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

  // Calculate time entry metrics
  const totalHours = clientTimeEntries.reduce(
    (sum, entry) => sum + (Number(entry.hours) || 0),
    0,
  );

  const billableHours = clientTimeEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push("/client-hub/clients")}
            className="rounded-full p-3 hover:bg-primary/10"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={3} />
          </Button>
          <div className="border-l pl-4">
            {isEditing ? (
              <Input
                value={editedClient?.name || ""}
                onChange={(e) =>
                  setEditedClient((prev: any) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="text-2xl font-bold h-auto py-2"
              />
            ) : (
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {client.name}
                {(client.type === "company" || client.type === "partnership") &&
                  client.registrationNumber && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:bg-primary hover:text-white p-2"
                      onClick={() =>
                        window.open(
                          `https://find-and-update.company-information.service.gov.uk/company/${client.registrationNumber}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-5 w-5" />
                    </Button>
                  )}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground font-mono">
                {client.clientCode}
              </span>
              {isEditing ? (
                <Select
                  value={editedClient?.status || "active"}
                  onValueChange={(value) =>
                    setEditedClient((prev: any) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <>
                  {getTypeBadge(client.type)}
                  {getStatusBadge(client.status)}
                </>
              )}
            </div>
            <div className="mt-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    Account Manager:
                  </span>
                  <Select
                    value={editedClient?.accountManagerId || "unassigned"}
                    onValueChange={(value) =>
                      setEditedClient((prev: any) => ({
                        ...prev,
                        accountManagerId:
                          value === "unassigned" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select manager..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {usersData?.users
                        .filter((user) => user.isActive)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Account Manager: {client.accountManagerId || "Unassigned"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleStartEdit} variant="outline">
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
            </>
          )}
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
                <CardTitle className="text-sm font-medium">
                  Active Tasks
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTasks}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Tasks
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueTasks}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Unbilled Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {unbilledHours.toFixed(1)}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Health Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {client.healthScore || 50}/100
                </div>
                <div className="mt-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (client.healthScore || 50) >= 75
                          ? "bg-green-500"
                          : (client.healthScore || 50) >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${client.healthScore || 50}%` }}
                    />
                  </div>
                </div>
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
              <CardContent>
                {client.type === "company" || client.type === "partnership" ? (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="text-sm font-medium mb-3">
                      Company Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        {client.registrationNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[110px]">
                              Company Number:
                            </span>
                            <span className="font-medium">
                              {client.registrationNumber}
                            </span>
                          </div>
                        )}
                        {client.incorporationDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[110px]">
                              Incorporated:
                            </span>
                            <span className="font-medium">
                              {format(
                                new Date(client.incorporationDate),
                                "dd/MM/yyyy",
                              )}
                            </span>
                          </div>
                        )}
                        {client.yearEnd && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[110px]">
                              Year End:
                            </span>
                            <span className="font-medium">{client.yearEnd}</span>
                          </div>
                        )}
                        {client.vatNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground min-w-[110px]">
                              VAT Number:
                            </span>
                            <span className="font-medium">{client.vatNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Registered Office Address */}
                      {(client.addressLine1 || client.city) && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">
                            Registered Office
                          </h5>
                          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                            {client.addressLine1 && <div>{client.addressLine1}</div>}
                            {client.addressLine2 && <div>{client.addressLine2}</div>}
                            {client.city && <div>{client.city}</div>}
                            {client.state && <div>{client.state}</div>}
                            {client.postalCode && <div>{client.postalCode}</div>}
                            {client.country && <div>{client.country}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    {(client.addressLine1 || client.city) && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Address</h5>
                        <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                          {client.addressLine1 && <div>{client.addressLine1}</div>}
                          {client.addressLine2 && <div>{client.addressLine2}</div>}
                          {client.city && <div>{client.city}</div>}
                          {client.state && <div>{client.state}</div>}
                          {client.postalCode && <div>{client.postalCode}</div>}
                          {client.country && <div>{client.country}</div>}
                        </div>
                      </div>
                    )}
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
              <CardContent>
                {contactsLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : contactsData?.contacts &&
                  contactsData.contacts.length > 0 ? (
                  <div className="space-y-4">
                    {/* Pre-populate Contact Dropdown - Only show when editing */}
                    {isEditing && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">
                          Pre-populate contact from:
                        </h4>
                        <Select
                          value={contactPrePopulationSource}
                          onValueChange={(value) => {
                            setContactPrePopulationSource(value);
                            if (value.startsWith("director-")) {
                              const directorId = value.replace("director-", "");
                              const director = directorsData?.directors.find(
                                (d) => d.id === directorId,
                              );
                              if (director && contactsData.contacts[0]) {
                                const names = parseFullName(director.name);
                                setEditedContact({
                                  ...contactsData.contacts[0],
                                  firstName: names.first,
                                  middleName: names.middle,
                                  lastName: names.last,
                                  jobTitle: director.officerRole,
                                  country:
                                    director.nationality || "United Kingdom",
                                  email: "",
                                  phone: "",
                                });
                                setIsEditingContact(true);
                              }
                            } else if (value.startsWith("psc-")) {
                              const pscId = value.replace("psc-", "");
                              const psc = pscsData?.pscs.find(
                                (p) => p.id === pscId,
                              );
                              if (psc && contactsData.contacts[0]) {
                                const names = parseFullName(psc.name);
                                setEditedContact({
                                  ...contactsData.contacts[0],
                                  firstName: names.first,
                                  middleName: names.middle,
                                  lastName: names.last,
                                  jobTitle: "Person with Significant Control",
                                  country: psc.nationality || "United Kingdom",
                                  email: "",
                                  phone: "",
                                });
                                setIsEditingContact(true);
                              }
                            } else if (value === "manual") {
                              if (contactsData.contacts[0]) {
                                setEditedContact({
                                  ...contactsData.contacts[0],
                                });
                                setIsEditingContact(true);
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose source..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">
                              📝 Enter Manually
                            </SelectItem>
                            {directorsData?.directors.map((director) => (
                              <SelectItem
                                key={director.id}
                                value={`director-${director.id}`}
                              >
                                📋 {director.name} (Director)
                              </SelectItem>
                            ))}
                            {pscsData?.pscs.map((psc) => (
                              <SelectItem key={psc.id} value={`psc-${psc.id}`}>
                                🏢 {psc.name} (PSC)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {contactsData.contacts.map((contact) => {
                      const isThisContactBeingEdited =
                        isEditingContact && editedContact?.id === contact.id;

                      return (
                        <div
                          key={contact.id}
                          className="p-4 bg-muted/50 rounded-lg border"
                        >
                          {isThisContactBeingEdited && editedContact ? (
                            /* Edit Mode */
                            <div className="space-y-4">
                              {/* Name Fields */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">First Name</Label>
                                  <Input
                                    value={editedContact.firstName || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        firstName: e.target.value,
                                      }))
                                    }
                                    placeholder="First name"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Middle Name</Label>
                                  <Input
                                    value={editedContact.middleName || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        middleName: e.target.value,
                                      }))
                                    }
                                    placeholder="Middle (optional)"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Last Name</Label>
                                  <Input
                                    value={editedContact.lastName || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        lastName: e.target.value,
                                      }))
                                    }
                                    placeholder="Last name"
                                  />
                                </div>
                              </div>

                              {/* Job Title and Primary Toggle */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Job Title</Label>
                                  <Input
                                    value={editedContact.jobTitle || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        jobTitle: e.target.value,
                                      }))
                                    }
                                    placeholder="Job title"
                                  />
                                </div>
                                <div className="flex items-end space-x-2">
                                  <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={editedContact.isPrimary}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        isPrimary: e.target.checked,
                                      }))
                                    }
                                    className="rounded"
                                  />
                                  <Label htmlFor="isPrimary" className="text-sm">
                                    Primary Contact
                                  </Label>
                                </div>
                              </div>

                              {/* Contact Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Email</Label>
                                  <Input
                                    type="email"
                                    value={editedContact.email || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        email: e.target.value,
                                      }))
                                    }
                                    placeholder="email@example.com"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Phone</Label>
                                  <Input
                                    type="tel"
                                    value={editedContact.phone || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        phone: e.target.value,
                                      }))
                                    }
                                    placeholder="Phone number"
                                  />
                                </div>
                              </div>

                              {/* Address */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Address</h4>
                                <div className="grid grid-cols-1 gap-3">
                                  <Input
                                    value={editedContact.addressLine1 || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        addressLine1: e.target.value,
                                      }))
                                    }
                                    placeholder="Address Line 1"
                                  />
                                  <Input
                                    value={editedContact.addressLine2 || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        addressLine2: e.target.value,
                                      }))
                                    }
                                    placeholder="Address Line 2 (optional)"
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Input
                                      value={editedContact.city || ""}
                                      onChange={(e) =>
                                        setEditedContact((prev: any) => ({
                                          ...prev,
                                          city: e.target.value,
                                        }))
                                      }
                                      placeholder="City"
                                    />
                                    <Input
                                      value={editedContact.region || ""}
                                      onChange={(e) =>
                                        setEditedContact((prev: any) => ({
                                          ...prev,
                                          region: e.target.value,
                                        }))
                                      }
                                      placeholder="Region/State"
                                    />
                                    <Input
                                      value={editedContact.postalCode || ""}
                                      onChange={(e) =>
                                        setEditedContact((prev: any) => ({
                                          ...prev,
                                          postalCode: e.target.value,
                                        }))
                                      }
                                      placeholder="Postal Code"
                                    />
                                  </div>
                                  <Input
                                    value={editedContact.country || ""}
                                    onChange={(e) =>
                                      setEditedContact((prev: any) => ({
                                        ...prev,
                                        country: e.target.value,
                                      }))
                                    }
                                    placeholder="Country"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode */
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-lg">
                                  {contact.title && `${contact.title} `}
                                  {contact.firstName}
                                  {contact.middleName &&
                                    ` ${contact.middleName}`}{" "}
                                  {contact.lastName}
                                </p>
                                {contact.isPrimary && (
                                  <Badge variant="default" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>

                              {contact.jobTitle && (
                                <p className="text-sm text-muted-foreground mb-3 font-medium">
                                  {contact.jobTitle}
                                </p>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contact Details */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium mb-2">
                                    Contact Details
                                  </h4>
                                  {contact.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                      <a
                                        href={`mailto:${contact.email}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {contact.email}
                                      </a>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                      <a
                                        href={`tel:${contact.phone}`}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {contact.phone}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Address */}
                                {(contact.addressLine1 || contact.city) && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium mb-2">
                                      Address
                                    </h4>
                                    <div className="text-sm text-muted-foreground leading-relaxed space-y-0.5">
                                      {contact.addressLine1 && (
                                        <div>{contact.addressLine1}</div>
                                      )}
                                      {contact.addressLine2 && (
                                        <div>{contact.addressLine2}</div>
                                      )}
                                      {contact.city && <div>{contact.city}</div>}
                                      {contact.region && (
                                        <div>
                                          {contact.region}{" "}
                                          {contact.postalCode &&
                                            contact.postalCode}
                                        </div>
                                      )}
                                      {contact.country && (
                                        <div>{contact.country}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No contact information available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Directors & Officers - Only show for companies/partnerships */}
          {(client.type === "company" || client.type === "partnership") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Directors & Officers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {directorsLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : directorsData?.directors &&
                    directorsData.directors.length > 0 ? (
                    <div className="space-y-4">
                      {directorsData.directors.map((director) => (
                        <div
                          key={director.id}
                          className="pb-4 border-b last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{director.name}</p>
                                {!director.isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Resigned
                                  </Badge>
                                )}
                              </div>
                              {director.officerRole && (
                                <p className="text-sm text-muted-foreground capitalize">
                                  {director.officerRole}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                            {director.appointedOn && (
                              <div>
                                <span className="text-muted-foreground">
                                  Appointed:{" "}
                                </span>
                                <span>
                                  {format(
                                    new Date(director.appointedOn),
                                    "dd/MM/yyyy",
                                  )}
                                </span>
                              </div>
                            )}
                            {director.resignedOn && (
                              <div>
                                <span className="text-muted-foreground">
                                  Resigned:{" "}
                                </span>
                                <span>
                                  {format(
                                    new Date(director.resignedOn),
                                    "dd/MM/yyyy",
                                  )}
                                </span>
                              </div>
                            )}
                            {director.nationality && (
                              <div>
                                <span className="text-muted-foreground">
                                  Nationality:{" "}
                                </span>
                                <span>{director.nationality}</span>
                              </div>
                            )}
                            {director.occupation && (
                              <div>
                                <span className="text-muted-foreground">
                                  Occupation:{" "}
                                </span>
                                <span>{director.occupation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No directors found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PSCs (Persons with Significant Control) */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Shareholders & PSCs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pscsLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : pscsData?.pscs && pscsData.pscs.length > 0 ? (
                    <div className="space-y-4">
                      {pscsData.pscs.map((psc) => (
                        <div
                          key={psc.id}
                          className="pb-4 border-b last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{psc.name}</p>
                                {!psc.isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Ceased
                                  </Badge>
                                )}
                              </div>
                              {psc.kind && (
                                <p className="text-xs text-muted-foreground">
                                  {psc.kind
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            {psc.naturesOfControl &&
                              Array.isArray(psc.naturesOfControl) &&
                              psc.naturesOfControl.length > 0 && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">
                                    Control:{" "}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {psc.naturesOfControl.map(
                                      (nature: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-xs px-2 py-0"
                                        >
                                          {nature
                                            .replace(/-/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase(),
                                            )}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            <div className="grid grid-cols-2 gap-x-4 text-xs mt-2">
                              {psc.notifiedOn && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Notified:{" "}
                                  </span>
                                  <span>
                                    {format(
                                      new Date(psc.notifiedOn),
                                      "dd/MM/yyyy",
                                    )}
                                  </span>
                                </div>
                              )}
                              {psc.nationality && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Nationality:{" "}
                                  </span>
                                  <span>{psc.nationality}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No PSCs found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Tasks */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Recent Tasks</CardTitle>
              {clientTasks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("tasks")}
                >
                  View All Tasks
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading tasks...</p>
                </div>
              ) : clientTasks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() =>
                      toast.success("Add task functionality coming soon")
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/practice-hub/tasks/${task.id}`)
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.priority === "urgent" && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        {task.targetDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Due:{" "}
                              {format(new Date(task.targetDate), "dd MMM yyyy")}
                            </span>
                            {new Date(task.targetDate) < new Date() &&
                              task.status !== "completed" && (
                                <span className="text-red-600 font-medium ml-1">
                                  (Overdue)
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {clientTasks.length > 5 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("tasks")}
                      >
                        View {clientTasks.length - 5} more tasks
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Active Services</h3>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
            {servicesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading services...</p>
              </div>
            ) : clientServices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No services configured</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Service</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Rate</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientServices.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">
                              {service.serviceName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {service.serviceCode}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{service.serviceCategory}</td>
                        <td className="p-3">
                          £{service.customRate || service.defaultRate || "0.00"}
                        </td>
                        <td className="p-3 capitalize">{service.priceType}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={service.isActive ? "default" : "secondary"}
                          >
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">All Tasks</h3>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
            {tasksLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : clientTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tasks found for this client
                </p>
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Priority</th>
                      <th className="text-left p-3">Due Date</th>
                      <th className="text-left p-3">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTasks.map((task) => (
                      <tr key={task.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{task.title}</div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {task.status?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              task.priority === "urgent" ||
                              task.priority === "high"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "dd/MM/yyyy")
                            : "-"}
                        </td>
                        <td className="p-3">
                          {(task as any).assigneeName || "Unassigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          {/* Time Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Billable Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{billableHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Unbilled Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{unbilledHours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">To be invoiced</p>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries List */}
          <Card className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Recent Time Entries</h3>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Time
              </Button>
            </div>
            {timeEntriesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading time entries...</p>
              </div>
            ) : clientTimeEntries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No time entries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Hours</th>
                      <th className="text-center p-3">Billable</th>
                      <th className="text-center p-3">Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTimeEntries.slice(0, 20).map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {format(new Date(entry.date), "dd/MM/yyyy")}
                        </td>
                        <td className="p-3">
                          <div className="max-w-md truncate">
                            {entry.description}
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {Number(entry.hours).toFixed(2)}h
                        </td>
                        <td className="p-3 text-center">
                          {entry.billable ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {entry.billed ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {clientTimeEntries.length > 20 && (
                  <div className="text-center py-4 text-sm text-muted-foreground border-t">
                    Showing first 20 of {clientTimeEntries.length} entries
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Invoices</h3>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
            {invoicesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            ) : clientInvoices.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Invoice #</th>
                      <th className="text-left p-3">Issue Date</th>
                      <th className="text-left p-3">Due Date</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-center p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-3 font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="p-3">
                          {format(new Date(invoice.issueDate), "dd/MM/yyyy")}
                        </td>
                        <td className="p-3">
                          {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                        </td>
                        <td className="p-3 text-right font-medium">
                          £{Number(invoice.total).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "overdue"
                                  ? "destructive"
                                  : invoice.status === "sent"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <h3 className="text-lg font-medium mb-2">
                  Document System Coming Soon
                </h3>
                <p className="text-muted-foreground mb-4">
                  Document management and storage will be available in a future
                  update.
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
