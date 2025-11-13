/**
 * Navigation type definitions for Employee Hub mobile app
 * Matches web app structure: Timesheets, Time Entries, Leave, TOIL, Approvals
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Timesheets: undefined;
  TimeEntries: undefined;
  Leave: undefined;
  Approvals: undefined;
};

export type TimesheetsStackParamList = {
  TimesheetsList: undefined;
  TimesheetSubmit: undefined;
  TimesheetDetail: { submissionId: string };
};

export type TimeEntriesStackParamList = {
  QuickEntry: undefined;
  EntryHistory: undefined;
};

export type LeaveStackParamList = {
  LeaveRequests: undefined;
  LeaveRequestForm: undefined;
  LeaveRequestDetail: { requestId: string };
  LeaveCalendar: undefined;
  LeaveBalance: undefined;
  TOILDashboard: undefined;
  TOILBalance: undefined;
  TOILHistory: undefined;
};

export type ApprovalsStackParamList = {
  ApprovalQueue: undefined;
  TimesheetDetail: {
    submissionId: string;
    userName: string;
    weekStartDate: string;
    weekEndDate: string;
    totalHours: number;
  };
  LeaveRequestDetail: {
    requestId: string;
    userName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    notes?: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
