/**
 * Import History Page
 *
 * Admin page for viewing CSV import history and logs
 * Located at: /admin-hub/settings/import-history
 */

import { Suspense } from "react";
import { ImportHistoryContent } from "@/components/admin/import-history-content";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImportHistoryPage() {
  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your CSV import logs and error reports
        </p>
      </div>

      <Suspense fallback={<ImportHistoryLoadingSkeleton />}>
        <ImportHistoryContent />
      </Suspense>
    </div>
  );
}

function ImportHistoryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Import Statistics</CardTitle>
          <CardDescription>Loading summary...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
