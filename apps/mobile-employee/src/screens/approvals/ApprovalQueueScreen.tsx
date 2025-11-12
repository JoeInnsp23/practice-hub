import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/colors";

/**
 * Approval queue screen - for managers to approve timesheets & leave
 * Matches web: app/employee-hub/approvals/page.tsx
 */
export function ApprovalQueueScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>Approval Queue</Text>
      <Text style={styles.helperText}>Items pending your approval will appear here</Text>
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
