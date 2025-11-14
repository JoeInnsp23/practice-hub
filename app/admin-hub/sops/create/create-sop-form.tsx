"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_FILE_TYPES = {
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  image: ["image/png", "image/jpeg", "image/jpg"],
  document: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
};

const createSopSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  requiresAcknowledgment: z.boolean(),
  requiresPasswordVerification: z.boolean(),
  expiryDate: z.string().optional(),
});

type CreateSopFormData = z.infer<typeof createSopSchema>;

export default function CreateSopForm() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateSopFormData>({
    resolver: zodResolver(createSopSchema),
    defaultValues: {
      requiresAcknowledgment: true,
      requiresPasswordVerification: true,
    },
  });

  const requiresAcknowledgment = watch("requiresAcknowledgment");
  const requiresPasswordVerification = watch("requiresPasswordVerification");

  // Fetch categories
  const { data: categoriesData } = trpc.sops.listCategories.useQuery();

  // Create mutation
  const createMutation = trpc.sops.create.useMutation({
    onSuccess: () => {
      toast.success("SOP created successfully");
      router.push("/admin-hub/sops");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const validateFile = (file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    let fileType: "pdf" | "video" | "document" | "image" | null = null;
    let maxSize = MAX_FILE_SIZE;

    // Determine file type
    if (extension === "pdf") {
      fileType = "pdf";
      maxSize = MAX_FILE_SIZE;
    } else if (["mp4", "mov", "avi"].includes(extension || "")) {
      fileType = "video";
      maxSize = MAX_VIDEO_SIZE;
    } else if (["png", "jpg", "jpeg"].includes(extension || "")) {
      fileType = "image";
      maxSize = MAX_IMAGE_SIZE;
    } else if (["docx", "doc"].includes(extension || "")) {
      fileType = "document";
      maxSize = MAX_FILE_SIZE;
    } else {
      return "Invalid file type. Supported: PDF, DOC, DOCX, MP4, MOV, AVI, PNG, JPG, JPEG";
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(2)}MB)`;
    }

    // Check MIME type
    const allowedTypes = ALLOWED_FILE_TYPES[fileType];
    if (!allowedTypes.includes(file.type)) {
      return `Invalid MIME type: ${file.type}. Expected one of: ${allowedTypes.join(", ")}`;
    }

    return null;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const onSubmit = async (data: CreateSopFormData) => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      // Convert file to base64
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Determine file type
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      let fileType: "pdf" | "video" | "document" | "image" = "pdf";
      if (["mp4", "mov", "avi"].includes(extension || "")) {
        fileType = "video";
      } else if (["png", "jpg", "jpeg"].includes(extension || "")) {
        fileType = "image";
      } else if (["docx", "doc"].includes(extension || "")) {
        fileType = "document";
      }

      await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        fileBuffer: base64,
        fileName: selectedFile.name,
        fileType,
        contentType: selectedFile.type,
        requiresAcknowledgment: data.requiresAcknowledgment,
        requiresPasswordVerification: data.requiresPasswordVerification,
        expiryDate: data.expiryDate || null,
      });
    } catch (_error) {
      // Error already handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., GDPR Data Protection Policy"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of this SOP..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="categoryId">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue("categoryId", value)}
              defaultValue=""
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.categoryId.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.mp4,.mov,.avi,.png,.jpg,.jpeg"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              <Label
                htmlFor="file-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer block ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supported formats: PDF, DOC, DOCX, MP4, MOV, AVI, PNG, JPG,
                  JPEG
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Max size: PDF/DOC (50MB), Video (500MB), Image (10MB)
                </p>
                <Button type="button" variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </Label>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Upload className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresAcknowledgment"
              checked={requiresAcknowledgment}
              onCheckedChange={(checked) =>
                setValue("requiresAcknowledgment", !!checked)
              }
            />
            <Label htmlFor="requiresAcknowledgment" className="cursor-pointer">
              Requires acknowledgment (users must confirm they have read this
              SOP)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresPasswordVerification"
              checked={requiresPasswordVerification}
              onCheckedChange={(checked) =>
                setValue("requiresPasswordVerification", !!checked)
              }
            />
            <Label
              htmlFor="requiresPasswordVerification"
              className="cursor-pointer"
            >
              Requires password verification (users must enter password to
              confirm)
            </Label>
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register("expiryDate")}
              min={new Date().toISOString().split("T")[0]}
            />
            <p className="text-xs text-muted-foreground mt-1">
              If set, this SOP will require re-acknowledgment after this date
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={createMutation.isPending || !selectedFile}
          size="lg"
        >
          {createMutation.isPending ? "Creating..." : "Create SOP"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
