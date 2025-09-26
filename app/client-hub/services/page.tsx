"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceCard } from "@/components/client-hub/services/service-card";
import { ServiceModal } from "@/components/client-hub/services/service-modal";
import {
  Plus,
  Search,
  Filter,
  Package,
  DollarSign,
  TrendingUp,
  Tag,
  Grid,
  List,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import toast from "react-hot-toast";

// Mock services data
const mockServices = [
  {
    id: "1",
    name: "Annual Accounts Preparation",
    description: "Complete preparation and filing of annual accounts including balance sheet, profit & loss, and director's report.",
    category: "Accounting",
    price: 1500,
    priceType: "fixed" as const,
    duration: "5-7 days",
    features: [
      "Full statutory accounts preparation",
      "Director's report",
      "Companies House filing",
      "HMRC submission",
    ],
    tags: ["year-end", "compliance", "statutory"],
    isActive: true,
  },
  {
    id: "2",
    name: "VAT Return Services",
    description: "Quarterly VAT return preparation and submission to HMRC with full compliance checks.",
    category: "Tax Services",
    price: 250,
    priceType: "fixed" as const,
    duration: "1-2 days",
    features: [
      "VAT calculation",
      "HMRC submission",
      "Compliance review",
      "VAT planning advice",
    ],
    tags: ["vat", "quarterly", "tax"],
    isActive: true,
  },
  {
    id: "3",
    name: "Bookkeeping Services",
    description: "Monthly bookkeeping services including bank reconciliation and expense categorization.",
    category: "Bookkeeping",
    price: 150,
    priceType: "hourly" as const,
    features: [
      "Bank reconciliation",
      "Expense tracking",
      "Invoice management",
      "Monthly reports",
    ],
    tags: ["monthly", "bookkeeping", "ongoing"],
    isActive: true,
  },
  {
    id: "4",
    name: "Personal Tax Return",
    description: "Complete self-assessment tax return preparation and submission for individuals.",
    category: "Tax Services",
    price: 350,
    priceType: "fixed" as const,
    duration: "2-3 days",
    features: [
      "Full self-assessment",
      "Tax calculation",
      "HMRC submission",
      "Tax planning advice",
    ],
    tags: ["personal", "self-assessment", "annual"],
    isActive: true,
  },
  {
    id: "5",
    name: "Corporation Tax Return",
    description: "Preparation and submission of CT600 corporation tax return with full computations.",
    category: "Tax Services",
    price: 850,
    priceType: "fixed" as const,
    duration: "3-4 days",
    features: [
      "CT600 preparation",
      "Tax computations",
      "HMRC submission",
      "R&D relief claims",
    ],
    tags: ["corporate", "ct600", "annual"],
    isActive: true,
  },
  {
    id: "6",
    name: "Payroll Processing",
    description: "Monthly payroll processing including RTI submissions and payslips for up to 10 employees.",
    category: "Payroll",
    price: 50,
    priceType: "monthly" as const,
    features: [
      "Payslip generation",
      "RTI submissions",
      "P60 and P45 processing",
      "Auto-enrolment support",
    ],
    tags: ["payroll", "monthly", "paye"],
    isActive: true,
  },
  {
    id: "7",
    name: "Company Formation",
    description: "Complete company formation service including registration and initial compliance setup.",
    category: "Company Formation",
    price: 250,
    priceType: "fixed" as const,
    duration: "1-2 days",
    features: [
      "Companies House registration",
      "Memorandum & Articles",
      "Share certificates",
      "Initial compliance setup",
    ],
    tags: ["formation", "new-business", "registration"],
    isActive: true,
  },
  {
    id: "8",
    name: "Business Advisory",
    description: "Strategic business consulting and financial planning services.",
    category: "Advisory",
    price: 200,
    priceType: "hourly" as const,
    features: [
      "Financial planning",
      "Growth strategy",
      "Cash flow management",
      "Investment advice",
    ],
    tags: ["consulting", "strategy", "planning"],
    isActive: true,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(mockServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category))];
    return cats.sort();
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((service) => service.category === categoryFilter);
    }

    return filtered;
  }, [services, searchTerm, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeServices = services.filter(s => s.isActive);
    const avgPrice = activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length;
    const categoryCounts = services.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total: services.length,
      active: activeServices.length,
      avgPrice: avgPrice || 0,
      topCategory: topCategory?.[0] || "N/A",
    };
  }, [services]);

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = (service: any) => {
    if (window.confirm(`Delete service "${service.name}"?`)) {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success("Service deleted");
    }
  };

  const handleSaveService = (data: any) => {
    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id ? { ...s, ...data, id: s.id } : s
        )
      );
    } else {
      const newService = {
        ...data,
        id: Date.now().toString(),
      };
      setServices((prev) => [...prev, newService]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your service catalog and pricing
          </p>
        </div>
        <Button onClick={handleAddService}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topCategory}</div>
            <p className="text-xs text-muted-foreground">
              Most services offered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Service categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Service Catalog</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || categoryFilter !== "all"
                ? "No services found matching your filters"
                : "No services added yet"}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        <Badge variant="secondary">{service.category}</Badge>
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                          className={service.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold">{formatCurrency(service.price)}</span>
                          <span className="text-sm text-gray-500">
                            / {service.priceType === "hourly" ? "hour" : service.priceType}
                          </span>
                        </div>
                        {service.duration && (
                          <div className="text-sm text-gray-500">
                            Duration: {service.duration}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        service={editingService}
      />
    </div>
  );
}