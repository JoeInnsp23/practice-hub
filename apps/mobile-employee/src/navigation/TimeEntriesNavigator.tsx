import { createStackNavigator } from "@react-navigation/stack";
import { QuickEntryScreen } from "../screens/time-entries/QuickEntryScreen";
import { TimeEntryHistoryScreen } from "../screens/time-entries/TimeEntryHistoryScreen";
import type { TimeEntriesStackParamList } from "./types";
import { COLORS } from "../lib/colors";

const Stack = createStackNavigator<TimeEntriesStackParamList>();

/**
 * Time Entries stack navigator - handles time entry screens
 */
export function TimeEntriesNavigator() {
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
        name="QuickEntry"
        component={QuickEntryScreen}
        options={{
          headerTitle: "Log Time",
        }}
      />
      <Stack.Screen
        name="EntryHistory"
        component={TimeEntryHistoryScreen}
        options={{
          headerTitle: "Time Entry History",
        }}
      />
    </Stack.Navigator>
  );
}
