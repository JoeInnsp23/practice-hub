"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentGrid } from "@/components/client-hub/documents/document-grid";
import { UploadModal } from "@/components/client-hub/documents/upload-modal";
import {
  Upload,
  FolderPlus,
  Search,
  Grid,
  List,
  Home,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// Mock document data
const mockDocuments = [
  {
    id: "1",
    name: "Tax Returns",
    type: "folder" as const,
    parentId: null,
    createdAt: new Date("2024-09-01"),
    modifiedAt: new Date("2024-09-25"),
    tags: ["tax"],
  },
  {
    id: "2",
    name: "Client Contracts",
    type: "folder" as const,
    parentId: null,
    createdAt: new Date("2024-09-01"),
    modifiedAt: new Date("2024-09-20"),
    tags: ["legal"],
  },
  {
    id: "3",
    name: "Invoices",
    type: "folder" as const,
    parentId: null,
    createdAt: new Date("2024-09-01"),
    modifiedAt: new Date("2024-09-24"),
    tags: ["billing"],
  },
  {
    id: "4",
    name: "ABC Company VAT Return Q4.pdf",
    type: "file" as const,
    fileType: "pdf",
    size: 245678,
    parentId: "1",
    client: "ABC Company Ltd",
    createdAt: new Date("2024-09-25"),
    modifiedAt: new Date("2024-09-25"),
    tags: ["vat", "q4"],
  },
  {
    id: "5",
    name: "XYZ Ltd Annual Accounts.xlsx",
    type: "file" as const,
    fileType: "spreadsheet",
    size: 1567890,
    parentId: "1",
    client: "XYZ Ltd",
    createdAt: new Date("2024-09-20"),
    modifiedAt: new Date("2024-09-20"),
    tags: ["accounts", "annual"],
  },
  {
    id: "6",
    name: "Service Agreement - John Doe.pdf",
    type: "file" as const,
    fileType: "pdf",
    size: 567234,
    parentId: "2",
    client: "John Doe",
    createdAt: new Date("2024-09-15"),
    modifiedAt: new Date("2024-09-15"),
    tags: ["contract", "service"],
  },
  {
    id: "7",
    name: "Invoice_001_ABC.pdf",
    type: "file" as const,
    fileType: "pdf",
    size: 123456,
    parentId: "3",
    client: "ABC Company Ltd",
    createdAt: new Date("2024-09-24"),
    modifiedAt: new Date("2024-09-24"),
    tags: ["invoice", "paid"],
  },
  {
    id: "8",
    name: "Company Registration.pdf",
    type: "file" as const,
    fileType: "pdf",
    size: 890123,
    parentId: null,
    client: "Tech Innovations Ltd",
    createdAt: new Date("2024-09-10"),
    modifiedAt: new Date("2024-09-10"),
    tags: ["registration", "legal"],
  },
  {
    id: "9",
    name: "Tax Planning 2024.docx",
    type: "file" as const,
    fileType: "document",
    size: 456789,
    parentId: null,
    createdAt: new Date("2024-09-18"),
    modifiedAt: new Date("2024-09-18"),
    tags: ["planning", "tax"],
  },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments);
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
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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

  const handleUpload = async (files: FileList, metadata: any) => {
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

  const handleView = (doc: any) => {
    toast.success(`Opening ${doc.name}`);
  };

  const handleEdit = (doc: any) => {
    const newName = window.prompt("Enter new name:", doc.name);
    if (newName && newName !== doc.name) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, name: newName } : d)),
      );
      toast.success("Renamed successfully");
    }
  };

  const handleDelete = (doc: any) => {
    if (window.confirm(`Delete "${doc.name}"?`)) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Deleted successfully");
    }
  };

  const handleShare = (doc: any) => {
    toast.success(`Sharing ${doc.name}`);
  };

  const handleDownload = (doc: any) => {
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
                onValueChange={(v) => setViewMode(v as any)}
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
