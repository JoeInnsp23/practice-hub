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
} from "lucide-react";
import toast from "react-hot-toast";

interface ClientDetailsProps {
  clientId: string;
}

// Mock data - in a real app this would come from the database
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
    companyNumber: "12345678",
    incorporationDate: new Date("2020-03-15"),
    yearEnd: "31 December",
    vatNumber: "GB123456789",
    registeredAddress: {
      line1: "123 Business Street",
      line2: "Suite 100",
      city: "London",
      postcode: "EC1A 1BB",
      country: "United Kingdom",
    },
    contact: {
      name: "Jane Doe",
      title: "Finance Director",
      email: "jane.doe@abccompany.com",
      phone: "+44 20 1234 5678",
    },
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
    contact: {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+44 20 9876 5432",
    },
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
    companyNumber: "87654321",
  },
];

// Mock metrics
const mockMetrics = {
  activeTasks: 8,
  overdueTasks: 2,
  unbilledHours: 24.5,
  healthScore: 85,
};

// Mock recent tasks
const mockRecentTasks = [
  {
    id: "1",
    name: "Annual Accounts Preparation",
    status: "in_progress",
    dueDate: new Date("2024-12-31"),
    assignee: "John Smith",
    description: "Prepare annual accounts for year ending December 2024",
    estimatedHours: 20,
  },
  {
    id: "2",
    name: "VAT Return Q4",
    status: "not_started",
    dueDate: new Date("2024-11-30"),
    assignee: "Jane Wilson",
    description: "Complete and submit quarterly VAT return",
    estimatedHours: 5,
  },
  {
    id: "3",
    name: "Payroll Processing",
    status: "completed",
    dueDate: new Date("2024-10-31"),
    assignee: "Bob Johnson",
    description: "Monthly payroll processing for all employees",
    estimatedHours: 3,
  },
  {
    id: "4",
    name: "Corporation Tax Return",
    status: "in_progress",
    dueDate: new Date("2024-12-15"),
    assignee: "Alice Brown",
    description: "Prepare and file corporation tax return",
    estimatedHours: 15,
  },
  {
    id: "5",
    name: "Management Accounts",
    status: "not_started",
    dueDate: new Date("2024-11-15"),
    assignee: "John Smith",
    description: "Prepare monthly management accounts",
    estimatedHours: 8,
  },
];

// Mock time entries
const mockTimeEntries = [
  {
    id: "1",
    taskName: "Annual Accounts Preparation",
    date: new Date("2024-10-25"),
    hours: 4.5,
    billable: true,
    billed: false,
    description: "Initial review of accounts",
    staff: "John Smith",
  },
  {
    id: "2",
    taskName: "VAT Return Q3",
    date: new Date("2024-10-24"),
    hours: 2.0,
    billable: true,
    billed: true,
    description: "VAT calculation and submission",
    staff: "Jane Wilson",
  },
  {
    id: "3",
    taskName: "General consultation",
    date: new Date("2024-10-23"),
    hours: 1.5,
    billable: true,
    billed: false,
    description: "Client meeting regarding tax planning",
    staff: "Bob Johnson",
  },
  {
    id: "4",
    taskName: "Payroll Processing",
    date: new Date("2024-10-22"),
    hours: 3.0,
    billable: true,
    billed: true,
    description: "October payroll run",
    staff: "Alice Brown",
  },
  {
    id: "5",
    taskName: "Email correspondence",
    date: new Date("2024-10-21"),
    hours: 0.5,
    billable: false,
    billed: false,
    description: "Responding to client queries",
    staff: "John Smith",
  },
];

// Mock services
const mockServices = [
  {
    id: "1",
    name: "Annual Accounts",
    type: "Compliance",
    frequency: "Annual",
    price: 2500,
    status: "active",
    nextDue: new Date("2024-12-31"),
  },
  {
    id: "2",
    name: "VAT Returns",
    type: "Compliance",
    frequency: "Quarterly",
    price: 400,
    status: "active",
    nextDue: new Date("2024-11-30"),
  },
  {
    id: "3",
    name: "Payroll Services",
    type: "Ongoing",
    frequency: "Monthly",
    price: 150,
    status: "active",
    nextDue: new Date("2024-11-01"),
  },
  {
    id: "4",
    name: "Corporation Tax",
    type: "Compliance",
    frequency: "Annual",
    price: 1500,
    status: "active",
    nextDue: new Date("2024-12-15"),
  },
];

// Mock invoices
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    date: new Date("2024-10-01"),
    dueDate: new Date("2024-10-31"),
    amount: 2500,
    status: "paid",
    description: "Annual accounts preparation",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    date: new Date("2024-10-15"),
    dueDate: new Date("2024-11-15"),
    amount: 400,
    status: "sent",
    description: "VAT Return Q3",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    date: new Date("2024-11-01"),
    dueDate: new Date("2024-12-01"),
    amount: 150,
    status: "draft",
    description: "Payroll services - October",
  },
];

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Find the client from mock data
  const client = mockClients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The client you're looking for doesn't exist.
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
              <span>Managed by {client.accountManager}</span>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-subtle h-14 w-full p-1.5 flex gap-1">
          <TabsTrigger
            value="overview"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
          >
            Services
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="time"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
          >
            Time Entries
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className={cn(
              "flex-1 rounded-md font-medium transition-all duration-200",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
            )}
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
                <div className="text-2xl font-bold">{mockMetrics.activeTasks}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.overdueTasks}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Unbilled Hours</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.unbilledHours}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.healthScore}/100</div>
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
                    {client.companyNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Company Number</p>
                        <p className="font-medium">{client.companyNumber}</p>
                      </div>
                    )}
                    {client.incorporationDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Incorporated</p>
                        <p className="font-medium">
                          {client.incorporationDate.toLocaleDateString()}
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
                {client.registeredAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Registered Address</p>
                    <div className="space-y-1">
                      <p>{client.registeredAddress.line1}</p>
                      {client.registeredAddress.line2 && <p>{client.registeredAddress.line2}</p>}
                      <p>{client.registeredAddress.city}</p>
                      <p>{client.registeredAddress.postcode}</p>
                      <p>{client.registeredAddress.country}</p>
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
                {client.contact ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Contact</p>
                      <p className="font-medium">{client.contact.name}</p>
                      {client.contact.title && (
                        <p className="text-sm text-muted-foreground">{client.contact.title}</p>
                      )}
                    </div>
                    {client.contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${client.contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.contact.email}
                        </a>
                      </div>
                    )}
                    {client.contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${client.contact.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {client.contact.phone}
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
              <div className="space-y-3">
                {mockRecentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    {getTaskStatusBadge(task.status)}
                  </div>
                ))}
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
              {mockServices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No services configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="outline">{service.type}</Badge>
                          <Badge
                            variant={service.status === "active" ? "default" : "secondary"}
                          >
                            {service.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Frequency: {service.frequency}</span>
                          <span>•</span>
                          <span>Next Due: {service.nextDue.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">£{service.price}</p>
                        <p className="text-sm text-muted-foreground">per {service.frequency.toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {mockRecentTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks found for this client</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockRecentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{task.name}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {task.dueDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.assignee}
                            </span>
                            {task.estimatedHours && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Est: {task.estimatedHours}h
                              </span>
                            )}
                          </div>
                        </div>
                        {getTaskStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <p className="text-2xl font-bold">
                  {mockTimeEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {mockTimeEntries
                    .filter((e) => e.billable)
                    .reduce((sum, entry) => sum + entry.hours, 0)
                    .toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Unbilled Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {mockTimeEntries
                    .filter((e) => e.billable && !e.billed)
                    .reduce((sum, entry) => sum + entry.hours, 0)
                    .toFixed(1)}
                </p>
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
              {mockTimeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No time entries found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockTimeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{entry.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.date.toLocaleDateString()} • {entry.staff}
                          {entry.description && ` • ${entry.description}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{entry.hours}h</p>
                        <div className="flex gap-2">
                          {entry.billable && (
                            <Badge variant={entry.billed ? "secondary" : "default"}>
                              {entry.billed ? "Billed" : "Billable"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {mockInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No invoices found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "sent"
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : ""
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {invoice.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Issued: {invoice.date.toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Due: {invoice.dueDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">£{invoice.amount.toFixed(2)}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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