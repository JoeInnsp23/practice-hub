import { createStackNavigator } from "@react-navigation/stack";
import { ApprovalQueueScreen } from "../screens/approvals/ApprovalQueueScreen";
import { TimesheetDetailScreen } from "../screens/approvals/TimesheetDetailScreen";
import { LeaveRequestDetailScreen } from "../screens/approvals/LeaveRequestDetailScreen";
import type { ApprovalsStackParamList } from "./types";
import { COLORS } from "../lib/colors";

const Stack = createStackNavigator<ApprovalsStackParamList>();

/**
 * Approvals stack navigator - handles approval workflow screens
 */
export function ApprovalsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="ApprovalQueue"
        component={ApprovalQueueScreen}
        options={{
          headerTitle: "Approvals",
        }}
      />
      <Stack.Screen
        name="TimesheetDetail"
        component={TimesheetDetailScreen}
        options={{
          headerTitle: "Review Timesheet",
        }}
      />
      <Stack.Screen
        name="LeaveRequestDetail"
        component={LeaveRequestDetailScreen}
        options={{
          headerTitle: "Review Leave Request",
        }}
      />
    </Stack.Navigator>
  );
}
