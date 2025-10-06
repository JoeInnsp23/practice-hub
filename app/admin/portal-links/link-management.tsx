"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  Folder,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc/client";
import { IconPicker } from "./icon-picker";
import { getIconComponent } from "./icon-utils";

const linkFormSchema = z.object({
  categoryId: z.string().uuid("Please select a category"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  url: z.string().min(1, "URL is required"),
  isInternal: z.boolean(),
  iconName: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  targetBlank: z.boolean(),
  requiresAuth: z.boolean(),
  allowedRoles: z.array(z.string()).optional(),
});

type LinkFormData = z.infer<typeof linkFormSchema>;

interface Category {
  id: string;
  name: string;
  description?: string | null;
  iconName?: string | null;
  colorHex?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Link {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  url: string;
  isInternal: boolean;
  iconName?: string | null;
  sortOrder: number;
  isActive: boolean;
  targetBlank: boolean;
  requiresAuth: boolean;
  allowedRoles?: unknown;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "client", label: "Client" },
];

export function LinkManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const { data: categories } = api.portal.getCategories.useQuery();
  const {
    data: links,
    isLoading,
    refetch,
  } = api.portal.getLinks.useQuery({
    categoryId: selectedCategory || undefined,
  });
  const createMutation = api.portal.createLink.useMutation();
  const updateMutation = api.portal.updateLink.useMutation();
  const deleteMutation = api.portal.deleteLink.useMutation();
  const reorderMutation = api.portal.reorderLinks.useMutation();

  // Group links by category
  const linksByCategory = React.useMemo(() => {
    if (!links || !categories) return [];

    const grouped = categories
      .filter(
        (cat: Category) => !selectedCategory || cat.id === selectedCategory,
      )
      .map((category: Category) => ({
        category,
        links: links
          .filter((link) => link.categoryId === category.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((group) => group.links.length > 0)
      .sort((a, b) => a.category.sortOrder - b.category.sortOrder);

    return grouped;
  }, [links, categories, selectedCategory]);

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      url: "",
      isInternal: false,
      iconName: "",
      sortOrder: 0,
      isActive: true,
      targetBlank: true,
      requiresAuth: false,
      allowedRoles: [],
    },
  });

  const handleEdit = (link: Link) => {
    setSelectedLink(link);
    form.reset({
      categoryId: link.categoryId,
      title: link.title,
      description: link.description || "",
      url: link.url,
      isInternal: link.isInternal,
      iconName: link.iconName || "",
      sortOrder: link.sortOrder,
      isActive: link.isActive,
      targetBlank: link.targetBlank,
      requiresAuth: link.requiresAuth,
      allowedRoles: (link.allowedRoles as string[] | null) || [],
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedLink(null);
    form.reset({
      categoryId: selectedCategory || "",
      title: "",
      description: "",
      url: "",
      isInternal: false,
      iconName: "",
      sortOrder: links?.length || 0,
      isActive: true,
      targetBlank: true,
      requiresAuth: false,
      allowedRoles: [],
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: LinkFormData) => {
    try {
      if (selectedLink) {
        await updateMutation.mutateAsync({
          id: selectedLink.id,
          ...data,
        });
        toast.success("Link updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Link created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (_error) {
      toast.error("Failed to save link");
    }
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: linkToDelete.id });
      toast.success("Link deleted successfully");
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
      refetch();
    } catch (_error) {
      toast.error("Failed to delete link");
    }
  };

  const handleReorder = async (
    links: Link[],
    index: number,
    direction: "up" | "down",
  ) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const reorderedLinks = [...links];
    [reorderedLinks[index], reorderedLinks[newIndex]] = [
      reorderedLinks[newIndex],
      reorderedLinks[index],
    ];

    const updates = reorderedLinks.map((link, idx) => ({
      id: link.id,
      sortOrder: idx,
    }));

    try {
      await reorderMutation.mutateAsync({ links: updates });
      refetch();
      toast.success("Links reordered");
    } catch (_error) {
      toast.error("Failed to reorder links");
    }
  };

  // Get category name for display
  const _getCategoryName = (categoryId: string) => {
    const category = categories?.find((c: Category) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Portal Links</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Categories</SelectItem>
              {categories?.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      {linksByCategory.length > 0 ? (
        <div className="space-y-6">
          {linksByCategory.map((group) => {
            const CategoryIcon = group.category.iconName
              ? getIconComponent(group.category.iconName) || Folder
              : Folder;
            const isCollapsed = collapsedCategories.has(group.category.id);

            return (
              <Card key={group.category.id} className="overflow-hidden">
                {/* Category Header */}
                <button
                  type="button"
                  className="w-full px-6 py-3 border-b flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity text-left"
                  style={{
                    backgroundColor: `${group.category.colorHex}10`,
                    borderColor: `${group.category.colorHex}30`,
                  }}
                  onClick={() => {
                    const newCollapsed = new Set(collapsedCategories);
                    if (isCollapsed) {
                      newCollapsed.delete(group.category.id);
                    } else {
                      newCollapsed.add(group.category.id);
                    }
                    setCollapsedCategories(newCollapsed);
                  }}
                >
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: group.category.colorHex || undefined,
                    }}
                  >
                    <CategoryIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{group.category.name}</h4>
                    {group.category.description && !isCollapsed && (
                      <p className="text-xs text-muted-foreground">
                        {group.category.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{group.links.length} links</Badge>
                </button>

                {/* Links Table */}
                {!isCollapsed && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Order</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.links.map((link, index) => {
                        const LinkIconComponent = link.iconName
                          ? getIconComponent(link.iconName)
                          : null;

                        return (
                          <TableRow key={link.id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReorder(group.links, index, "up")
                                  }
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReorder(group.links, index, "down")
                                  }
                                  disabled={index === group.links.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {LinkIconComponent && (
                                  <LinkIconComponent className="h-4 w-4" />
                                )}
                                {link.title}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="flex items-center gap-1">
                                {link.targetBlank ? (
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                ) : (
                                  <LinkIcon className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate">{link.url}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  link.isInternal ? "secondary" : "outline"
                                }
                              >
                                {link.isInternal ? "Internal" : "External"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  link.isActive ? "default" : "secondary"
                                }
                              >
                                {link.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(link)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setLinkToDelete(link);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            {selectedCategory
              ? "No links found in this category. Create your first link to get started."
              : "No links found. Create your first link to get started."}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLink ? "Edit Link" : "Create Link"}
            </DialogTitle>
            <DialogDescription>
              {selectedLink
                ? "Update the link details below"
                : "Add a new link to the portal"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., VAT Returns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this link"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com or /internal/page"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      External URLs must start with http(s)://. Internal paths
                      should start with /
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose an icon to display with this link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Display order (lower numbers appear first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isInternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Internal Link</FormLabel>
                        <FormDescription>
                          Link points to a page within this application
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetBlank"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Open in New Tab</FormLabel>
                        <FormDescription>
                          Opens link in a new browser tab
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requiresAuth"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Requires Auth</FormLabel>
                        <FormDescription>
                          Users must be logged in to access
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive links won't be displayed
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowedRoles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed Roles</FormLabel>
                    <FormDescription>
                      Select which roles can see this link (leave empty for all)
                    </FormDescription>
                    <div className="space-y-2">
                      {roleOptions.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`role-${role.value}`}
                            checked={field.value?.includes(role.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, role.value]);
                              } else {
                                field.onChange(
                                  current.filter((r) => r !== role.value),
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`role-${role.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {role.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedLink ? "Update" : "Create"} Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{linkToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
