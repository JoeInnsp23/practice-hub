"use client";

import {
  DollarSign,
  Filter,
  Grid,
  List,
  Package,
  Plus,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { ServiceCard } from "@/components/client-hub/services/service-card";
import { ServiceModal } from "@/components/client-hub/services/service-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils/format";

type Service = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  defaultRate: string | null;
  price: string | null;
  priceType: "hourly" | "fixed" | "retainer" | "project" | "percentage" | null;
  duration: number | null;
  tags: any;
  isActive: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

export default function ServicesPage() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch services using tRPC
  const { data: servicesData, isLoading: loading } =
    trpc.services.list.useQuery({
      search: debouncedSearchTerm || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
    });

  const services = servicesData?.services || [];

  // tRPC mutations
  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success("Service created successfully");
      utils.services.list.invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });

  const updateMutation = trpc.services.update.useMutation({
    onSuccess: () => {
      toast.success("Service updated successfully");
      utils.services.list.invalidate();
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update service: ${error.message}`);
    },
  });

  const deleteMutation = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success("Service deleted");
      utils.services.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete service: ${error.message}`);
    },
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [
      ...new Set(
        services.map((s) => s.category).filter((c): c is string => c !== null),
      ),
    ];
    return cats.sort();
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (Array.isArray(service.tags) &&
            service.tags.some((tag: string) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase()),
            )),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (service) => service.category === categoryFilter,
      );
    }

    return filtered;
  }, [services, searchTerm, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeServices = services.filter((s) => s.isActive);
    const pricesSum = activeServices.reduce(
      (sum, s) => sum + (s.price ? parseFloat(s.price) : 0),
      0,
    );
    const avgPrice =
      activeServices.length > 0 ? pricesSum / activeServices.length : 0;
    const categoryCounts = services.reduce(
      (acc, s) => {
        const cat = s.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const topCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

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

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    if (window.confirm(`Delete service "${service.name}"?`)) {
      deleteMutation.mutate(service.id);
    }
  };

  const handleSaveService = (data: any) => {
    if (editingService) {
      updateMutation.mutate({
        id: editingService.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground mt-2">
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
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
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
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgPrice)}
            </div>
            <p className="text-xs text-muted-foreground">Across all services</p>
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
            <p className="text-xs text-muted-foreground">Service categories</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "grid" | "list")}
              >
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
            <div className="text-center py-12 text-muted-foreground">
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
                        <h3 className="text-lg font-semibold">
                          {service.name}
                        </h3>
                        <Badge variant="secondary">{service.category}</Badge>
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                          className={
                            service.isActive
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold">
                            {service.price
                              ? formatCurrency(parseFloat(service.price))
                              : "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{" "}
                            {service.priceType === "hourly"
                              ? "hour"
                              : service.priceType}
                          </span>
                        </div>
                        {service.duration && (
                          <div className="text-sm text-muted-foreground">
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
