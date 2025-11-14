"use client";

import { BookOpen, CheckCircle, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyTrainingPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Training</h1>
        <p className="text-muted-foreground mt-2">
          Track your training progress, complete required SOPs, and stay
          compliant with annual re-certification requirements.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/employee-hub/training/sops" className="group">
          <Card className="glass-card h-full transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  SOPs Library
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse and read required Standard Operating Procedures
              </p>
            </CardContent>
          </Card>
        </a>

        <a href="/employee-hub/training" className="group">
          <Card className="glass-card h-full transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Interactive Training
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete interactive training modules with quizzes
              </p>
            </CardContent>
          </Card>
        </a>

        <a href="/employee-hub/training/compliance" className="group">
          <Card className="glass-card h-full transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Compliance Dashboard
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your compliance status and upcoming deadlines
              </p>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Upcoming Deadlines (Empty State) */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Upcoming Deadlines</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No upcoming training deadlines at this time
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              When you&apos;re assigned training materials, deadlines will
              appear here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity (Empty State) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No recent training activity</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your completed SOPs and training modules will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
