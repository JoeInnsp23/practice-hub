import { createStackNavigator } from "@react-navigation/stack";
import { TimesheetsListScreen } from "../screens/timesheets/TimesheetsListScreen";
import { TimesheetSubmitScreen } from "../screens/timesheets/TimesheetSubmitScreen";
import type { TimesheetsStackParamList } from "./types";
import { COLORS } from "../lib/colors";

const Stack = createStackNavigator<TimesheetsStackParamList>();

/**
 * Timesheets stack navigator - handles timesheet screens
 */
export function TimesheetsNavigator() {
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
        name="TimesheetsList"
        component={TimesheetsListScreen}
        options={{
          headerTitle: "Timesheets",
        }}
      />
      <Stack.Screen
        name="TimesheetSubmit"
        component={TimesheetSubmitScreen}
        options={{
          headerTitle: "Submit Timesheet",
        }}
      />
    </Stack.Navigator>
  );
}
