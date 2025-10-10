"use client";

import {
  Download,
  Edit,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Image,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";

interface DocumentData {
  document: {
    id: string;
    name: string;
    type: "folder" | "file";
    mimeType: string | null;
    size: number | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: unknown;
    clientId: string | null;
    url: string | null;
    path: string;
    isPublic: boolean;
  };
  uploader: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string;
  } | null;
}

interface DocumentGridProps {
  documents: DocumentData[];
  viewMode: "grid" | "list";
  onFolderClick: (folderId: string) => void;
  onDownload: (doc: DocumentData) => void;
  onDelete: (doc: DocumentData) => void;
  onShare: (doc: DocumentData) => void;
  onRename?: (doc: DocumentData) => void;
}

export function DocumentGrid({
  documents,
  viewMode,
  onFolderClick,
  onDownload,
  onDelete,
  onShare,
  onRename,
}: DocumentGridProps) {
  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return File;

    if (mimeType.includes("pdf") || mimeType.includes("document")) {
      return FileText;
    } else if (mimeType.includes("sheet") || mimeType.includes("excel")) {
      return FileSpreadsheet;
    } else if (mimeType.includes("image")) {
      return Image;
    }
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  const handleDoubleClick = (doc: DocumentData) => {
    if (doc.document.type === "folder") {
      onFolderClick(doc.document.id);
    } else {
      onDownload(doc);
    }
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {documents.map((doc) => {
          const Icon =
            doc.document.type === "folder" ? Folder : getFileIcon(doc.document.mimeType);

          return (
            <Card
              key={doc.document.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onDoubleClick={() => handleDoubleClick(doc)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Icon
                    className={cn(
                      "h-12 w-12",
                      doc.document.type === "folder"
                        ? "text-blue-500"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="w-full">
                    <p
                      className="text-sm font-medium truncate"
                      title={doc.document.name}
                    >
                      {doc.document.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.document.type === "folder"
                        ? "Folder"
                        : formatFileSize(doc.document.size)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {doc.document.type === "folder" ? (
                        <DropdownMenuItem onClick={() => onFolderClick(doc.document.id)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {onRename && (
                        <DropdownMenuItem onClick={() => onRename(doc)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onShare(doc)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(doc)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List View
  return (
    <div className="glass-table">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="text-left p-4 font-medium">Name</th>
            <th className="text-left p-4 font-medium">Client</th>
            <th className="text-left p-4 font-medium">Uploaded By</th>
            <th className="text-left p-4 font-medium">Size</th>
            <th className="text-left p-4 font-medium">Modified</th>
            <th className="text-left p-4 font-medium">Tags</th>
            <th className="text-right p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const Icon =
              doc.document.type === "folder" ? Folder : getFileIcon(doc.document.mimeType);

            return (
              <tr
                key={doc.document.id}
                className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onDoubleClick={() => handleDoubleClick(doc)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        doc.document.type === "folder"
                          ? "text-blue-500"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="font-medium">{doc.document.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {doc.client?.companyName || doc.client?.name || "-"}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {doc.uploader
                    ? `${doc.uploader.firstName || ""} ${doc.uploader.lastName || ""}`.trim() || doc.uploader.email
                    : "-"}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {doc.document.type === "folder"
                    ? "Folder"
                    : formatFileSize(doc.document.size)}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {formatDate(doc.document.updatedAt)}
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {Array.isArray(doc.document.tags) && doc.document.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {doc.document.type === "folder" ? (
                        <DropdownMenuItem onClick={() => onFolderClick(doc.document.id)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onDownload(doc)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {onRename && (
                        <DropdownMenuItem onClick={() => onRename(doc)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onShare(doc)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(doc)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
