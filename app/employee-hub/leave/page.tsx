"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LeaveRequestModal } from "@/components/employee-hub/leave/leave-request-modal";
import { LeaveTab } from "@/components/employee-hub/leave/leave-tab";
import { ToilTab } from "@/components/employee-hub/toil/toil-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaveRequest } from "@/lib/trpc/types";

export default function UnifiedLeavePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state management
  const activeTab = searchParams.get("tab") || "leave";
  const shouldOpenModal = searchParams.get("action") === "request";

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [defaultLeaveType, setDefaultLeaveType] = useState<
    "annual_leave" | "sick_leave" | "toil" | "unpaid" | "other"
  >("annual_leave");

  // Auto-open modal from URL
  useEffect(() => {
    if (shouldOpenModal) {
      setIsModalOpen(true);
      // Clean URL after opening modal
      const params = new URLSearchParams(searchParams);
      params.delete("action");
      router.replace(`/employee-hub/leave?${params.toString()}`);
    }
  }, [shouldOpenModal, searchParams, router]);

  // Tab change handler
  const handleTabChange = (value: string) => {
    router.push(`/employee-hub/leave?tab=${value}`);
  };

  // Request leave handlers
  const handleRequestLeave = (
    leaveType: "annual_leave" | "toil" = "annual_leave",
  ) => {
    setEditingRequest(null);
    setDefaultLeaveType(leaveType);
    setIsModalOpen(true);
  };

  const handleRequestToilLeave = () => {
    handleRequestLeave("toil");
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setDefaultLeaveType(request.leaveType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
    setDefaultLeaveType("annual_leave");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leave & TOIL</h1>
        <p className="text-muted-foreground mt-2">
          Manage your leave requests and time off in lieu
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6" aria-label="Leave and TOIL management">
          <TabsTrigger value="leave">My Leave</TabsTrigger>
          <TabsTrigger value="toil">My TOIL</TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <LeaveTab
            onRequestLeave={() => handleRequestLeave("annual_leave")}
            onEditRequest={handleEditRequest}
          />
        </TabsContent>

        <TabsContent value="toil">
          <ToilTab onRequestToilLeave={handleRequestToilLeave} />
        </TabsContent>
      </Tabs>

      {/* Leave Request Modal (shared) */}
      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={editingRequest}
        defaultLeaveType={defaultLeaveType}
      />
    </div>
  );
}
