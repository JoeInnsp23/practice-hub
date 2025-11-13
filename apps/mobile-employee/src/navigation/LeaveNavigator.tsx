import { createStackNavigator } from "@react-navigation/stack";
import { LeaveRequestsScreen } from "../screens/leave/LeaveRequestsScreen";
import { LeaveRequestFormScreen } from "../screens/leave/LeaveRequestFormScreen";
import { LeaveBalanceScreen } from "../screens/leave/LeaveBalanceScreen";
import { TOILDashboardScreen } from "../screens/leave/TOILDashboardScreen";
import { TOILHistoryScreen } from "../screens/leave/TOILHistoryScreen";
import type { LeaveStackParamList } from "./types";
import { COLORS } from "../lib/colors";

const Stack = createStackNavigator<LeaveStackParamList>();

/**
 * Leave stack navigator - handles leave request screens
 */
export function LeaveNavigator() {
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
        name="LeaveRequests"
        component={LeaveRequestsScreen}
        options={{
          headerTitle: "Leave",
        }}
      />
      <Stack.Screen
        name="LeaveRequestForm"
        component={LeaveRequestFormScreen}
        options={{
          headerTitle: "Request Leave",
        }}
      />
      <Stack.Screen
        name="LeaveBalance"
        component={LeaveBalanceScreen}
        options={{
          headerTitle: "Leave Balance",
        }}
      />
      <Stack.Screen
        name="TOILDashboard"
        component={TOILDashboardScreen}
        options={{
          headerTitle: "TOIL",
        }}
      />
      <Stack.Screen
        name="TOILHistory"
        component={TOILHistoryScreen}
        options={{
          headerTitle: "TOIL History",
        }}
      />
    </Stack.Navigator>
  );
}
