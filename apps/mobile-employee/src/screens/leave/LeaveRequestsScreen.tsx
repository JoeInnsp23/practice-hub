import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/colors";

/**
 * Leave requests screen - view and manage leave requests
 * Matches web: app/employee-hub/leave/page.tsx
 */
export function LeaveRequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>Leave Requests</Text>
      <Text style={styles.helperText}>Your leave requests will appear here</Text>
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
