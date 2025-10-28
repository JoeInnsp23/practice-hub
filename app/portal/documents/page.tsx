"use client";

import { CheckCircle2, FileSignature } from "lucide-react";
import { useState } from "react";
import { DocumentsToSignList } from "@/components/client-portal/documents/documents-to-sign-list";
import { SignedDocumentsList } from "@/components/client-portal/documents/signed-documents-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientPortalContext } from "@/contexts/client-portal-context";

export default function DocumentsPage() {
  const { currentClientId } = useClientPortalContext();
  const [activeTab, setActiveTab] = useState<"to-sign" | "signed">("to-sign");

  if (!currentClientId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-card-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Access your important documents and files
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSignature className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Please select a client to view documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-card-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Sign documents and access your signed files
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "signed" | "to-sign")}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="to-sign" className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            To Sign
          </TabsTrigger>
          <TabsTrigger value="signed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Signed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="to-sign">
          <Card>
            <CardHeader>
              <CardTitle>Documents Requiring Signature</CardTitle>
              <CardDescription>
                Review and sign documents sent by your accountant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsToSignList clientId={currentClientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signed">
          <Card>
            <CardHeader>
              <CardTitle>Signed Documents</CardTitle>
              <CardDescription>
                Download your completed and signed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignedDocumentsList clientId={currentClientId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
