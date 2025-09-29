"use client";

import React, { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Palette,
} from "lucide-react";
import toast from "react-hot-toast";
import { IconPicker } from "./icon-picker";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  iconName: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export function CategoryManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  const { data: categories, isLoading, refetch } = api.portal.getCategories.useQuery();
  const createMutation = api.portal.createCategory.useMutation();
  const updateMutation = api.portal.updateCategory.useMutation();
  const deleteMutation = api.portal.deleteCategory.useMutation();
  const reorderMutation = api.portal.reorderCategories.useMutation();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "",
      colorHex: "#ff8609",
      sortOrder: 0,
      isActive: true,
    },
  });

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      iconName: category.iconName || "",
      colorHex: category.colorHex || "#ff8609",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    form.reset({
      name: "",
      description: "",
      iconName: "",
      colorHex: "#ff8609",
      sortOrder: categories?.length || 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (selectedCategory) {
        await updateMutation.mutateAsync({
          id: selectedCategory.id,
          ...data,
        });
        toast.success("Category updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: categoryToDelete.id });
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleReorder = async (categories: any[], index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const reorderedCategories = [...categories];
    [reorderedCategories[index], reorderedCategories[newIndex]] =
    [reorderedCategories[newIndex], reorderedCategories[index]];

    const updates = reorderedCategories.map((cat, idx) => ({
      id: cat.id,
      sortOrder: idx,
    }));

    try {
      await reorderMutation.mutateAsync({ categories: updates });
      refetch();
      toast.success("Categories reordered");
    } catch (error) {
      toast.error("Failed to reorder categories");
    }
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
        <h3 className="text-lg font-semibold">Portal Categories</h3>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Icon</TableHead>
              <TableHead className="w-24">Color</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category: any, index: number) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(categories, index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(categories, index, "down")}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {category.description || "-"}
                </TableCell>
                <TableCell>{category.iconName || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: category.colorHex }}
                    />
                    <span className="text-xs font-mono">{category.colorHex}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Update the category details below"
                : "Add a new category to organize portal links"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tax Resources" {...field} />
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
                        placeholder="Brief description of this category"
                        {...field}
                      />
                    </FormControl>
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
                        <IconPicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>
                        Choose an icon to represent this category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-20 h-10 p-1 cursor-pointer"
                            {...field}
                          />
                          <Input
                            type="text"
                            placeholder="#ff8609"
                            {...field}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Category color in hex format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Display order (lower numbers appear first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Inactive categories won't be displayed
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedCategory ? "Update" : "Create"} Category
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This will also delete
              all links in this category. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}