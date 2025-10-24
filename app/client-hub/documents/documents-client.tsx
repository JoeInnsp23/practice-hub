"use client";

import * as Sentry from "@sentry/nextjs";
import {
  ChevronRight,
  FileSignature,
  FolderPlus,
  Grid,
  Home,
  List,
  Search,
  Share2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { DocumentGrid } from "@/components/client-hub/documents/document-grid";
import { FilePreviewModal } from "@/components/client-hub/documents/file-preview-modal";
import { SignatureUploadModal } from "@/components/client-hub/documents/signature-upload-modal";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DocumentsClient() {
  const utils = trpc.useUtils();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch documents
  const { data: documentsData } = trpc.documents.list.useQuery({
    parentId: currentFolder,
    search: searchTerm || undefined,
    limit: 100,
  });

  // Fetch storage stats
  const { data: storageStats } = trpc.documents.getStorageStats.useQuery();

  // Create folder mutation
  const createFolderMutation = trpc.documents.createFolder.useMutation({
    onSuccess: () => {
      toast.success("Folder created successfully");
      utils.documents.list.invalidate();
      setIsNewFolderOpen(false);
      setNewFolderName("");
    },
    onError: (error) => {
      toast.error(`Failed to create folder: ${error.message}`);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      utils.documents.list.invalidate();
      utils.documents.getStorageStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Share document mutation
  const shareDocumentMutation = trpc.documents.createShareLink.useMutation({
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast.success("Share link copied to clipboard!");
      setIsShareDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create share link: ${error.message}`);
    },
  });

  // Rename document mutation
  const renameDocumentMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Renamed successfully");
      utils.documents.list.invalidate();
      setIsRenameOpen(false);
      setNewName("");
    },
    onError: (error) => {
      toast.error(`Failed to rename: ${error.message}`);
    },
  });

  const documents = documentsData?.documents || [];

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path: any[] = [];
    let folderId = currentFolder;

    while (folderId) {
      const folder = documents.find(
        (d: any) => d.document.id === folderId && d.document.type === "folder",
      );
      if (folder) {
        path.unshift(folder);
        folderId = folder.document.parentId;
      } else {
        break;
      }
    }

    return path;
  }, [currentFolder, documents]);

  const handleUpload = async (
    files: FileList,
    metadata: { client: string; tags: string[]; parentId: string | null },
  ) => {
    const formData = new FormData();

    // Add files
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    // Add metadata
    formData.append("parentId", metadata.parentId || "");
    formData.append("clientId", metadata.client || "");
    formData.append("tags", JSON.stringify(metadata.tags));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      // Refresh documents list
      await utils.documents.list.invalidate();
      await utils.documents.getStorageStats.invalidate();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "upload_document" },
        extra: { fileCount: files.length },
      });
      throw error;
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    createFolderMutation.mutate({
      name: newFolderName,
      parentId: currentFolder,
    });
  };

  const handleDownload = (doc: any) => {
    window.open(`/api/documents/${doc.document.id}/download`, "_blank");
  };

  const handleDelete = (doc: any) => {
    if (
      confirm(
        `Are you sure you want to delete "${doc.document.name}"?${doc.document.type === "folder" ? " This will only work if the folder is empty." : ""}`,
      )
    ) {
      deleteDocumentMutation.mutate({ documentId: doc.document.id });
    }
  };

  const handleShare = (doc: any) => {
    setSelectedDocument(doc);
    setIsShareDialogOpen(true);
  };

  const handleCreateShareLink = () => {
    if (!selectedDocument) return;

    shareDocumentMutation.mutate({
      documentId: selectedDocument.document.id,
      expiresIn: 86400 * 7, // 7 days
    });
  };

  const handleRename = (doc: any) => {
    setSelectedDocument(doc);
    setNewName(doc.document.name);
    setIsRenameOpen(true);
  };

  const handleRenameSubmit = () => {
    if (!selectedDocument || !newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    renameDocumentMutation.mutate({
      documentId: selectedDocument.document.id,
      name: newName.trim(),
    });
  };

  const _handlePreview = (doc: any) => {
    setSelectedDocument(doc);
    setIsPreviewOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your files and folders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsSignatureModalOpen(true)}
          >
            <FileSignature className="h-4 w-4 mr-2" />
            Request Signature
          </Button>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            data-testid="document-upload-button"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageStats?.totalFiles || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(storageStats?.totalSize || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quota Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storageStats?.quotaUsedPercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of 10 GB available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentFolder(null);
              }}
            >
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbPath.map((folder, index) => (
            <div key={folder.document.id} className="flex items-center gap-2">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {index === breadcrumbPath.length - 1 ? (
                  <BreadcrumbPage>{folder.document.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentFolder(folder.document.id);
                    }}
                  >
                    {folder.document.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

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
        </CardContent>
      </Card>

      {/* Documents Grid/List */}
      <DocumentGrid
        documents={documents}
        viewMode={viewMode}
        onFolderClick={(folderId) => setCurrentFolder(folderId)}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onShare={handleShare}
        onRename={handleRename}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        currentFolderId={currentFolder}
      />

      {/* Signature Upload Modal */}
      <SignatureUploadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSuccess={() => {
          utils.documents.list.invalidate();
          setIsSignatureModalOpen(false);
        }}
      />

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Tax Returns 2024"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Create a shareable link for "{selectedDocument?.document.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A link will be created that anyone with the link can access. The
              link will expire in 7 days.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateShareLink}
              disabled={shareDocumentMutation.isPending}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Create & Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for "{selectedDocument?.document.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={renameDocumentMutation.isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={selectedDocument}
        onDownload={() => {
          if (selectedDocument) {
            handleDownload(selectedDocument);
          }
        }}
      />
    </div>
  );
}
