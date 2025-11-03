"use client";

import { Calendar, Umbrella } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { LeaveRequestModal } from "@/components/employee-hub/leave/leave-request-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaveRequestPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Fetch leave balance
  const { data: balanceResponse, isLoading } = trpc.leave.getBalance.useQuery(
    {},
  );

  const balance = balanceResponse?.balance
    ? {
        entitlement: balanceResponse.balance.annualEntitlement,
        used: balanceResponse.balance.annualUsed,
        remaining: balanceResponse.annualRemaining,
        carriedOver: balanceResponse.balance.carriedOver,
        toilBalance: balanceResponse.balance.toilBalance,
        sickUsed: balanceResponse.balance.sickUsed,
      }
    : undefined;

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Navigate back to leave page after closing modal
    router.push("/employee-hub/leave");
  };

  const annualRemaining = balanceResponse?.annualRemaining || 0;
  const toilBalanceHours = balance?.toilBalance || 0;
  const toilBalanceDays = (toilBalanceHours / 7.5).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Request Leave</h1>
        <p className="text-muted-foreground mt-2">Submit a new leave request</p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPIWidget
          title="Annual Leave Remaining"
          value={`${annualRemaining.toFixed(1)} days`}
          icon={Calendar}
          loading={isLoading}
          iconColor="text-emerald-600"
        />
        <KPIWidget
          title="TOIL Balance"
          value={`${toilBalanceDays} days`}
          icon={Umbrella}
          loading={isLoading}
          iconColor="text-blue-600"
        />
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Leave Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete the form below to submit a leave request. Your manager will
            review and approve or reject your request.
          </p>
          <p className="text-xs text-muted-foreground">
            Available balances: {annualRemaining.toFixed(1)} days annual leave,{" "}
            {toilBalanceDays} days TOIL
          </p>
        </CardContent>
      </Card>

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={null}
        balance={balance}
      />
    </div>
  );
}
