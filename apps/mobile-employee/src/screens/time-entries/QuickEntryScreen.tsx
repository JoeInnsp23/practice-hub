import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/colors";

/**
 * Quick time entry screen - log time quickly
 * Matches web: app/employee-hub/time-entries/page.tsx
 */
export function QuickEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>Quick Time Entry</Text>
      <Text style={styles.helperText}>Log your time quickly</Text>
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
