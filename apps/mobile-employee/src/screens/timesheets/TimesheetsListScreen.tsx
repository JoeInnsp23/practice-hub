import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { COLORS } from "../../lib/colors";

/**
 * Timesheets list screen - shows weekly timesheets
 * Matches web: app/employee-hub/timesheets/page.tsx
 */
export function TimesheetsListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>No timesheets yet</Text>
      <Text style={styles.helperText}>Your weekly timesheets will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
