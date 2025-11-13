import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/main/DashboardScreen";
import { TimesheetsListScreen } from "../screens/timesheets/TimesheetsListScreen";
import { TimeEntriesNavigator } from "./TimeEntriesNavigator";
import { LeaveNavigator } from "./LeaveNavigator";
import { ApprovalQueueScreen } from "../screens/approvals/ApprovalQueueScreen";
import type { MainTabParamList } from "./types";
import { COLORS } from "../lib/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main app navigation with bottom tabs
 * Dashboard, Timesheets, Time Entries, Leave, Approvals
 * Matches web Employee Hub structure
 */
export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.primary, // Emerald green
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Timesheets"
        component={TimesheetsListScreen}
        options={{
          tabBarLabel: "Timesheets",
        }}
      />
      <Tab.Screen
        name="TimeEntries"
        component={TimeEntriesNavigator}
        options={{
          headerShown: false,
          title: "Time Entry",
          tabBarLabel: "Log Time",
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Leave",
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalQueueScreen}
        options={{
          tabBarLabel: "Approvals",
        }}
      />
    </Tab.Navigator>
  );
}
