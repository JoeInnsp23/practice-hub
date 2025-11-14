"use client";

import { BookOpen, FileText, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SopsLibraryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">SOPs Library</h1>
        <p className="text-muted-foreground mt-2">
          Browse and read Standard Operating Procedures organized by category.
          Complete required readings to maintain compliance.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search SOPs by title, category, or keyword..."
          className="pl-10 glass-card"
          disabled
        />
      </div>

      {/* Category Preview Cards (Empty State) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">
                Governance &amp; Compliance
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              0 SOPs • 0 assigned to you
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-base">Client Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              0 SOPs • 0 assigned to you
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-base">Technical Procedures</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              0 SOPs • 0 assigned to you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="glass-card">
        <CardContent className="py-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No SOPs Available Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your organization hasn&apos;t published any SOPs yet. When SOPs
              are published and assigned to you, they will appear here organized
              by category.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
