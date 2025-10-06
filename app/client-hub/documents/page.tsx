"use client";

import {
  ChevronRight,
  FolderPlus,
  Grid,
  Home,
  List,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DocumentGrid } from "@/components/client-hub/documents/document-grid";
import { UploadModal } from "@/components/client-hub/documents/upload-modal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface UploadMetadata {
  parentId: string | null;
  client?: string;
  tags?: string[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = [];
    let folderId = currentFolder;

    while (folderId) {
      const folder = documents.find((d) => d.id === folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  }, [currentFolder, documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => doc.parentId === currentFolder);

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Sort folders first, then files
    return filtered.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [documents, currentFolder, searchTerm]);

  // Calculate storage stats
  const stats = useMemo(() => {
    const files = documents.filter((d) => d.type === "file");
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

    return {
      totalFiles: files.length,
      totalFolders: documents.filter((d) => d.type === "folder").length,
      totalSize,
      recentFiles: files
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        .slice(0, 5),
    };
  }, [documents]);

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const handleCreateFolder = () => {
    const name = window.prompt("Enter folder name:");
    if (name) {
      const newFolder = {
        id: Date.now().toString(),
        name,
        type: "folder" as const,
        parentId: currentFolder,
        createdAt: new Date(),
        modifiedAt: new Date(),
        tags: [],
      };
      setDocuments((prev) => [...prev, newFolder]);
      toast.success("Folder created successfully");
    }
  };

  const handleUpload = async (files: FileList, metadata: UploadMetadata) => {
    const newDocs = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: "file" as const,
      fileType: file.type,
      size: file.size,
      parentId: metadata.parentId,
      client: metadata.client,
      createdAt: new Date(),
      modifiedAt: new Date(),
      tags: metadata.tags,
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const handleView = (doc: Document) => {
    toast.success(`Opening ${doc.name}`);
  };

  const handleEdit = (doc: Document) => {
    const newName = window.prompt("Enter new name:", doc.name);
    if (newName && newName !== doc.name) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, name: newName } : d)),
      );
      toast.success("Renamed successfully");
    }
  };

  const handleDelete = (doc: Document) => {
    if (window.confirm(`Delete "${doc.name}"?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Deleted successfully");
    }
  };

  const handleShare = (doc: Document) => {
    toast.success(`Sharing ${doc.name}`);
  };

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.name}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize all your documents and files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalFiles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalFolders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatFileSize(stats.totalSize)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recentFiles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation and Search */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => handleNavigate(null)}
                  >
                    <Home className="h-4 w-4" />
                    Documents
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbPath.map((folder, index) => (
                  <span key={folder.id}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {index === breadcrumbPath.length - 1 ? (
                        <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          className="cursor-pointer"
                          onClick={() => handleNavigate(folder.id)}
                        >
                          {folder.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Search and View Toggle */}
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "No documents found matching your search"
                : "No documents in this folder"}
            </div>
          ) : (
            <DocumentGrid
              documents={filteredDocuments}
              currentFolder={currentFolder}
              viewMode={viewMode}
              onNavigate={handleNavigate}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        currentFolderId={currentFolder}
      />
    </div>
  );
}
