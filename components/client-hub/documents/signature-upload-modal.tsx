"use client";

import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
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
import { Textarea } from "@/components/ui/textarea";

interface SignatureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SignatureUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: SignatureUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);

  // Fetch clients for dropdown
  const { data: clients } = trpc.clients.list.useQuery({});

  // Create signature document mutation
  const createSignatureDoc = trpc.documents.createSignatureDocument.useMutation(
    {
      onSuccess: (data) => {
        toast.success("Document uploaded! Signature request sent to client.");
        setSigningUrl(data.signingUrl);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(`Failed to create signature request: ${error.message}`);
        setIsUploading(false);
      },
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate PDF
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed for signature requests");
        return;
      }

      // Validate size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      // Auto-fill name if empty
      if (!name) {
        setName(selectedFile.name.replace(".pdf", ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !clientId || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload file to S3
      const formData = new FormData();
      formData.append("files", file);
      formData.append("parentId", "");
      formData.append("clientId", clientId);
      formData.append("tags", JSON.stringify([]));

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const uploadedDoc = uploadData.documents[0];

      // Step 2: Create signature request
      await createSignatureDoc.mutateAsync({
        name,
        clientId,
        url: uploadedDoc.url,
        description: description || undefined,
        size: file.size,
        mimeType: file.type,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setClientId("");
    setName("");
    setDescription("");
    setIsUploading(false);
    setSigningUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Client Signature</DialogTitle>
          <DialogDescription>
            Upload a PDF document that requires client signature. The client
            will receive an email with a signing link.
          </DialogDescription>
        </DialogHeader>

        {signingUrl ? (
          // Success state
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Signature Request Sent!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    The client has been emailed a signing link. You can also
                    share the link below directly.
                  </p>
                  <div className="mt-3">
                    <Label className="text-xs">Signing URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={signingUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(signingUrl);
                          toast.success("Link copied to clipboard!");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Upload form
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="client">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">
                PDF Document <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1">
                <label
                  htmlFor="file"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="text-center">
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload PDF (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="name">
                Document Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Service Agreement 2024"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes or instructions for the client..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {signingUrl ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !file || !clientId || !name}
              >
                {isUploading ? "Uploading..." : "Upload & Send"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
