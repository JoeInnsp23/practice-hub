import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/main/DashboardScreen";
import { ClientsScreen } from "../screens/ClientsScreen";
import type { MainTabParamList } from "./types";
import { COLORS } from "../lib/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main app navigation with bottom tabs
 * Dashboard, Clients, Proposals, Documents, Profile
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
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarLabel: "Clients",
        }}
      />
      {/* TODO: Add Proposals, Documents, Profile tabs */}
    </Tab.Navigator>
  );
}
