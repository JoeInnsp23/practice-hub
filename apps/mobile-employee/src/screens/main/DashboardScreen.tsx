import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../lib/colors";

/**
 * Dashboard/Home screen for Employee Hub
 * Shows quick stats, recent activity, and quick actions
 */
export function DashboardScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || "User"}!</Text>
        <Text style={styles.subtitle}>Welcome to Practice Hub</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0h</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Leave Days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0h</Text>
          <Text style={styles.statLabel}>TOIL Balance</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          title="Log Time"
          variant="primary"
          onPress={() => {
            // TODO: Navigate to time entry
          }}
          style={styles.actionButton}
        />
        <Button
          title="Request Leave"
          variant="outline"
          onPress={() => {
            // TODO: Navigate to leave request
          }}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.section}>
        <Button title="Sign Out" variant="ghost" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary, // Emerald green
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
});
