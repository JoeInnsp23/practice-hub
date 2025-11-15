"use client";

import { format } from "date-fns";
import {
  Archive,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Sop {
  id: string;
  title: string;
  description: string | null;
  categoryName: string | null;
  status: "draft" | "published" | "archived" | "under_review";
  version: string;
  fileType: "pdf" | "video" | "document" | "image";
  publishedAt: Date | null;
  createdAt: Date;
  createdByName: string;
}

interface SopsTableProps {
  sops: Sop[];
  isLoading: boolean;
  onEdit: (sopId: string) => void;
  onView: (sopId: string) => void;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  published:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  under_review:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const fileTypeIcons = {
  pdf: FileText,
  video: FileText,
  document: FileText,
  image: FileText,
};

export default function SopsTable({
  sops,
  isLoading,
  onEdit,
  onView,
}: SopsTableProps) {
  const utils = trpc.useUtils();

  const publishMutation = trpc.sops.publish.useMutation({
    onSuccess: () => {
      toast.success("SOP published successfully");
      utils.sops.list.invalidate();
      utils.sops.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const archiveMutation = trpc.sops.archive.useMutation({
    onSuccess: () => {
      toast.success("SOP archived successfully");
      utils.sops.list.invalidate();
      utils.sops.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePublish = (sopId: string) => {
    if (
      confirm(
        "Are you sure you want to publish this SOP? It will be visible to assigned users.",
      )
    ) {
      publishMutation.mutate(sopId);
    }
  };

  const handleArchive = (sopId: string) => {
    if (confirm("Are you sure you want to archive this SOP?")) {
      archiveMutation.mutate(sopId);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 glass-table">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (sops.length === 0) {
    return (
      <Card className="p-12 text-center glass-card">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">
          No SOPs found
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first SOP to get started
        </p>
      </Card>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Published Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sops.map((sop) => {
            const FileIcon = fileTypeIcons[sop.fileType];
            return (
              <TableRow key={sop.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sop.title}</p>
                      {sop.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {sop.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{sop.categoryName}</TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[sop.status]}
                    variant="secondary"
                  >
                    {sop.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{sop.version}</span>
                </TableCell>
                <TableCell>{sop.createdByName}</TableCell>
                <TableCell>
                  {sop.publishedAt
                    ? format(new Date(sop.publishedAt), "MMM d, yyyy")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(sop.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(sop.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {sop.status === "draft" && (
                        <DropdownMenuItem onClick={() => handlePublish(sop.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {sop.status !== "archived" && (
                        <DropdownMenuItem onClick={() => handleArchive(sop.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
