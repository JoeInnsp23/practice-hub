"use client";

import { formatDistanceToNow } from "date-fns";
import { Edit2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/lib/auth-client";
import { highlightMentions } from "@/lib/services/mention-parser";
import { trpc } from "@/lib/trpc/client";
import { MentionAutocomplete } from "../client-hub/mention-autocomplete";

interface ProposalNotesSectionProps {
  proposalId: string;
}

export function ProposalNotesSection({
  proposalId,
}: ProposalNotesSectionProps) {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // Queries
  const { data: notes = [], isLoading } = trpc.proposals.getNotes.useQuery({
    proposalId,
  });

  // Mutations
  const createNote = trpc.proposals.createNote.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      setNote("");
      setIsInternal(false);
      setMentionedUsers([]);
      utils.proposals.getNotes.invalidate({ proposalId });
      utils.proposals.getNoteCount.invalidate({ proposalId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const updateNote = trpc.proposals.updateNote.useMutation({
    onSuccess: () => {
      toast.success("Comment updated");
      setEditingNoteId(null);
      setEditNote("");
      utils.proposals.getNotes.invalidate({ proposalId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });

  const deleteNote = trpc.proposals.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      setDeleteNoteId(null);
      utils.proposals.getNotes.invalidate({ proposalId });
      utils.proposals.getNoteCount.invalidate({ proposalId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  // Handlers
  const handleSubmit = () => {
    if (!note.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    createNote.mutate({
      proposalId,
      note,
      isInternal,
      mentionedUsers,
    });
  };

  const handleMention = (userId: string) => {
    if (!mentionedUsers.includes(userId)) {
      setMentionedUsers([...mentionedUsers, userId]);
    }
  };

  const startEdit = (noteId: string, noteText: string) => {
    setEditingNoteId(noteId);
    setEditNote(noteText);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditNote("");
  };

  const handleUpdate = (noteId: string) => {
    if (!editNote.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    updateNote.mutate({
      noteId,
      note: editNote,
    });
  };

  const handleDelete = () => {
    if (!deleteNoteId) return;

    deleteNote.mutate({
      noteId: deleteNoteId,
    });
  };

  // Check if current user can edit/delete a note
  // Only check if user is the author (role checks are server-side)
  const canModifyNote = (authorId: string) => {
    if (!session?.user) return false;
    return session.user.id === authorId;
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatAbsoluteTimestamp = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">({notes.length})</span>
      </div>

      {/* Comment Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <MentionAutocomplete
              value={note}
              onChange={setNote}
              onMention={handleMention}
              placeholder="Write a comment... Type @ to mention someone"
              disabled={createNote.isPending}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="internal-note"
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(checked === true)}
                />
                <label
                  htmlFor="internal-note"
                  className="text-sm cursor-pointer select-none"
                >
                  Internal Note (Staff Only)
                </label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createNote.isPending || !note.trim()}
              >
                {createNote.isPending ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Timeline */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading comments...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((noteItem) => (
            <Card key={noteItem.id} className="glass-card">
              <CardContent className="pt-6">
                {editingNoteId === noteItem.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(noteItem.id)}
                        disabled={updateNote.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={updateNote.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {noteItem.author.firstName} {noteItem.author.lastName}
                        </span>
                        <span
                          className="text-xs text-muted-foreground cursor-help"
                          title={formatAbsoluteTimestamp(noteItem.createdAt)}
                        >
                          {formatTimestamp(noteItem.createdAt)}
                        </span>
                        {noteItem.updatedAt > noteItem.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            (edited)
                          </span>
                        )}
                        {noteItem.isInternal && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded font-medium">
                            Staff Only
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {canModifyNote(noteItem.author.id) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              startEdit(noteItem.id, noteItem.note)
                            }
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteNoteId(noteItem.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Note content with highlighted mentions */}
                    <div
                      className="prose dark:prose-invert prose-sm max-w-none"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: Only injecting styled spans for @mentions
                      dangerouslySetInnerHTML={{
                        __html: highlightMentions(noteItem.note),
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteNoteId !== null}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
