import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";

/**
 * TOIL History - Full list of all TOIL accruals
 * Matches web: app/employee-hub/leave/toil/history/page.tsx
 */
export function TOILHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = trpc.toil.getHistory.useQuery({
    limit: 100,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading TOIL history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading history</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No TOIL history</Text>
        <Text style={styles.helperText}>
          TOIL is automatically earned when you log overtime hours that are
          approved by your manager
        </Text>
      </View>
    );
  }

  // Calculate totals
  const totalHours = history.reduce(
    (sum, record) => sum + record.hoursAccrued,
    0,
  );
  const activeHours = history
    .filter((record) => !record.expired)
    .reduce((sum, record) => sum + record.hoursAccrued, 0);
  const expiredHours = history
    .filter((record) => record.expired)
    .reduce((sum, record) => sum + record.hoursAccrued, 0);

  return (
    <FlatList
      style={styles.container}
      data={history}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.hoursAccrued,
                item.expired && styles.hoursExpired,
              ]}
            >
              +{item.hoursAccrued}h
            </Text>
            {item.expired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>Expired</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDetail}>
            Week ending: {formatDate(item.weekEnding)}
          </Text>

          <View style={styles.hoursBreakdown}>
            <Text style={styles.breakdownText}>
              Logged: {item.loggedHours}h
            </Text>
            <Text style={styles.breakdownText}>
              Contracted: {item.contractedHours}h
            </Text>
            <Text style={styles.breakdownText}>
              Overtime: {item.hoursAccrued}h
            </Text>
          </View>

          <Text style={styles.expiryDate}>
            {item.expired
              ? `Expired: ${formatDate(item.expiryDate)}`
              : `Expires: ${formatDate(item.expiryDate)}`}
          </Text>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TOIL History</Text>
          <Text style={styles.headerSubtitle}>{history.length} records</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Earned:</Text>
              <Text style={styles.summaryValue}>
                {totalHours}h ({(totalHours / 7.5).toFixed(1)} days)
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active:</Text>
              <Text style={[styles.summaryValue, styles.activeText]}>
                {activeHours}h ({(activeHours / 7.5).toFixed(1)} days)
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expired:</Text>
              <Text style={[styles.summaryValue, styles.expiredColor]}>
                {expiredHours}h ({(expiredHours / 7.5).toFixed(1)} days)
              </Text>
            </View>
          </View>
        </View>
      }
    />
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  activeText: {
    color: COLORS.primary,
  },
  expiredColor: {
    color: "#991b1b",
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  hoursAccrued: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  hoursExpired: {
    color: "#9ca3af",
  },
  expiredBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991b1b",
  },
  cardDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  hoursBreakdown: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  breakdownText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
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
