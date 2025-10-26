"use client";

import { FolderInput, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkActionBarProps {
  selectedDocumentIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkActionBar({
  selectedDocumentIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [addTags, setAddTags] = useState<boolean>(false);

  const utils = trpc.useUtils();

  // Fetch folders for move operation
  const { data: foldersData } = trpc.documents.list.useQuery({
    type: "folder",
  });
  const folders = foldersData?.documents || [];

  // Bulk move mutation
  const bulkMoveMutation = trpc.documents.bulkMove.useMutation({
    onSuccess: (data) => {
      toast.success(`Moved ${data.count} document(s)`);
      utils.documents.list.invalidate();
      setIsMoveDialogOpen(false);
      setSelectedFolderId("");
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move documents");
    },
  });

  // Bulk change category/tags mutation
  const bulkChangeCategoryMutation =
    trpc.documents.bulkChangeCategory.useMutation({
      onSuccess: (data) => {
        toast.success(
          `${addTags ? "Added" : "Changed"} tags for ${data.count} document(s)`
        );
        utils.documents.list.invalidate();
        setIsTagsDialogOpen(false);
        setTagsInput("");
        setAddTags(false);
        onClearSelection();
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update document tags");
      },
    });

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.documents.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.count} document(s)`);
      utils.documents.list.invalidate();
      setIsDeleteDialogOpen(false);
      onClearSelection();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete documents");
    },
  });

  const handleBulkMove = () => {
    bulkMoveMutation.mutate({
      documentIds: selectedDocumentIds,
      parentId: selectedFolderId || null,
    });
  };

  const handleBulkChangeTags = () => {
    if (!tagsInput.trim()) {
      toast.error("Please enter at least one tag");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (tags.length === 0) {
      toast.error("Please enter valid tags");
      return;
    }

    bulkChangeCategoryMutation.mutate({
      documentIds: selectedDocumentIds,
      tags,
      addTags,
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({
      documentIds: selectedDocumentIds,
    });
  };

  return (
    <>
      <div className="mx-6 my-4 p-3 bg-muted rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedDocumentIds.length} document{selectedDocumentIds.length > 1 ? "s" : ""}{" "}
          selected
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMoveDialogOpen(true)}
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Move to Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTagsDialogOpen(true)}
          >
            <Tag className="h-4 w-4 mr-2" />
            Change Tags
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Move to Folder Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Documents</DialogTitle>
            <DialogDescription>
              Move {selectedDocumentIds.length} selected document
              {selectedDocumentIds.length > 1 ? "s" : ""} to a folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder">Destination Folder</Label>
              <Select
                value={selectedFolderId}
                onValueChange={setSelectedFolderId}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select folder (or root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Root Folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkMove}
              disabled={bulkMoveMutation.isPending}
            >
              {bulkMoveMutation.isPending ? "Moving..." : "Move Documents"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tags Dialog */}
      <Dialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Document Tags</DialogTitle>
            <DialogDescription>
              Update tags for {selectedDocumentIds.length} selected document
              {selectedDocumentIds.length > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags *</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas (e.g., urgent, tax, 2024)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter multiple tags separated by commas
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={addTags ? "add" : "replace"}
                onValueChange={(value) => setAddTags(value === "add")}
              >
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">Replace existing tags</SelectItem>
                  <SelectItem value="add">Add to existing tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTagsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkChangeTags}
              disabled={bulkChangeCategoryMutation.isPending}
            >
              {bulkChangeCategoryMutation.isPending
                ? "Updating..."
                : "Update Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDocumentIds.length} selected
              document{selectedDocumentIds.length > 1 ? "s" : ""}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Documents"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
