"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  Image,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Edit,
  Share2,
  FolderOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: "folder" | "file";
  fileType?: string;
  size?: number;
  parentId: string | null;
  createdAt: Date;
  modifiedAt: Date;
  client?: string;
  tags?: string[];
  sharedWith?: string[];
}

interface DocumentGridProps {
  documents: Document[];
  currentFolder: string | null;
  viewMode: "grid" | "list";
  onNavigate: (folderId: string | null) => void;
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onShare: (doc: Document) => void;
  onDownload: (doc: Document) => void;
}

export function DocumentGrid({
  documents,
  currentFolder,
  viewMode,
  onNavigate,
  onView,
  onEdit,
  onDelete,
  onShare,
  onDownload,
}: DocumentGridProps) {
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return File;

    if (fileType.includes("pdf") || fileType.includes("document")) {
      return FileText;
    } else if (fileType.includes("sheet") || fileType.includes("excel")) {
      return FileSpreadsheet;
    } else if (fileType.includes("image")) {
      return Image;
    }
    return File;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDoubleClick = (doc: Document) => {
    if (doc.type === "folder") {
      onNavigate(doc.id);
    } else {
      onView(doc);
    }
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {documents.map((doc) => {
          const Icon = doc.type === "folder" ? Folder : getFileIcon(doc.fileType);

          return (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onDoubleClick={() => handleDoubleClick(doc)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Icon
                    className={cn(
                      "h-12 w-12",
                      doc.type === "folder" ? "text-blue-500" : "text-gray-500"
                    )}
                  />
                  <div className="w-full">
                    <p className="text-sm font-medium truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.type === "folder"
                        ? `${documents.filter(d => d.parentId === doc.id).length} items`
                        : formatFileSize(doc.size)
                      }
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
                      {doc.type === "folder" ? (
                        <DropdownMenuItem onClick={() => onNavigate(doc.id)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onView(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(doc)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare(doc)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(doc)}
                        className="text-red-600"
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
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="text-left p-4 font-medium">Name</th>
            <th className="text-left p-4 font-medium">Client</th>
            <th className="text-left p-4 font-medium">Size</th>
            <th className="text-left p-4 font-medium">Modified</th>
            <th className="text-left p-4 font-medium">Tags</th>
            <th className="text-right p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const Icon = doc.type === "folder" ? Folder : getFileIcon(doc.fileType);

            return (
              <tr
                key={doc.id}
                className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onDoubleClick={() => handleDoubleClick(doc)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        doc.type === "folder" ? "text-blue-500" : "text-gray-500"
                      )}
                    />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {doc.client || "-"}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {doc.type === "folder"
                    ? `${documents.filter(d => d.parentId === doc.id).length} items`
                    : formatFileSize(doc.size)
                  }
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {formatDate(doc.modifiedAt)}
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {doc.tags?.slice(0, 2).map((tag) => (
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
                      {doc.type === "folder" ? (
                        <DropdownMenuItem onClick={() => onNavigate(doc.id)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => onView(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(doc)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShare(doc)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(doc)}
                        className="text-red-600"
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