"use client";

import { FileText, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Access your important documents and files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            Your shared documents will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Document Library Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              We're working on bringing you a comprehensive document library where you can access all your important files, contracts, and reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
