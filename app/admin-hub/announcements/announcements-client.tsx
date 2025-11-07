"use client";

import { format } from "date-fns";
import { AlertCircle, Edit, Megaphone, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getIconComponent } from "../portal-links/icon-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnnouncementFormDialog } from "./announcement-form-dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string;
  iconColor: string;
  priority: "info" | "warning" | "critical";
  isPinned: boolean;
  publishedAt: Date;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export function AnnouncementsClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);

  const { data: announcements, isLoading } =
    trpc.announcements.adminList.useQuery({});
  const deleteMutation = trpc.announcements.delete.useMutation();
  const toggleActiveMutation = trpc.announcements.toggleActive.useMutation();
  const pinMutation = trpc.announcements.pin.useMutation();

  const utils = trpc.useUtils();

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsCreateDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: announcementToDelete.id });
      toast.success("Announcement deleted successfully");
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
      utils.announcements.adminList.invalidate();
    } catch (_error) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleToggleActive = async (
    announcementId: string,
    isActive: boolean,
  ) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: announcementId,
        isActive,
      });
      toast.success(
        isActive ? "Announcement activated" : "Announcement deactivated",
      );
      utils.announcements.adminList.invalidate();
    } catch (_error) {
      toast.error("Failed to update announcement status");
    }
  };

  const handleTogglePin = async (announcementId: string, isPinned: boolean) => {
    try {
      await pinMutation.mutateAsync({
        id: announcementId,
        isPinned,
      });
      toast.success(isPinned ? "Announcement pinned" : "Announcement unpinned");
      utils.announcements.adminList.invalidate();
    } catch (_error) {
      toast.error("Failed to update pin status");
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Critical
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 dark:text-yellow-400"
          >
            Warning
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Info
          </Badge>
        );
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/20 rounded-lg">
              <Megaphone className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-card-foreground">
                Company Announcements
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage practice-wide announcements with scheduling and priority
                levels
              </p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-28 whitespace-nowrap">Priority</TableHead>
                  <TableHead className="max-w-md">Title</TableHead>
                  <TableHead className="w-20 text-center whitespace-nowrap">Pinned</TableHead>
                  <TableHead className="w-40 whitespace-nowrap">Published</TableHead>
                  <TableHead className="w-40 whitespace-nowrap">Starts</TableHead>
                  <TableHead className="w-40 whitespace-nowrap">Expires</TableHead>
                  <TableHead className="w-32 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading announcements...
                    </TableCell>
                  </TableRow>
                ) : !announcements || announcements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Megaphone className="h-8 w-8 opacity-50" />
                        <p>No announcements yet. Create your first one!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="whitespace-nowrap">
                        <Switch
                          checked={announcement.isActive}
                          onCheckedChange={(checked) =>
                            handleToggleActive(announcement.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getPriorityBadge(announcement.priority)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded flex-shrink-0"
                            style={{
                              backgroundColor: `${announcement.iconColor}20`,
                            }}
                          >
                            {(() => {
                              const IconComponent = getIconComponent(announcement.icon) || Megaphone;
                              return (
                                <IconComponent
                                  className="h-4 w-4"
                                  style={{ color: announcement.iconColor }}
                                />
                              );
                            })()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium break-words">
                              {announcement.title}
                            </div>
                            <div className="text-sm text-muted-foreground break-words">
                              {announcement.content}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTogglePin(
                              announcement.id,
                              !announcement.isPinned,
                            )
                          }
                        >
                          <Pin
                            className={`h-4 w-4 ${
                              announcement.isPinned
                                ? "fill-current text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(announcement.publishedAt)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(announcement.startsAt)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateTime(announcement.endsAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAnnouncementToDelete(announcement);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <AnnouncementFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        announcement={selectedAnnouncement}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setSelectedAnnouncement(null);
          utils.announcements.adminList.invalidate();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{announcementToDelete?.title}"?
              This action cannot be undone.
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
