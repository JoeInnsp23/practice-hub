import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import type { StackNavigationProp } from "@react-navigation/stack";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import type { LeaveStackParamList } from "../../navigation/types";

type TOILDashboardScreenNavigationProp = StackNavigationProp<
  LeaveStackParamList,
  "TOILDashboard"
>;

type Props = {
  navigation: TOILDashboardScreenNavigationProp;
};

/**
 * TOIL Dashboard - Shows current balance, expiring TOIL, recent accruals
 * Matches web: app/employee-hub/leave/toil/page.tsx
 */
export function TOILDashboardScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  // Query TOIL balance
  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = trpc.toil.getBalance.useQuery({});

  // Query expiring TOIL (next 30 days)
  const {
    data: expiringData,
    isLoading: expiringLoading,
    refetch: refetchExpiring,
  } = trpc.toil.getExpiringToil.useQuery({ daysAhead: 30 });

  // Query recent history (last 5 entries)
  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = trpc.toil.getHistory.useQuery({ limit: 5 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchExpiring(), refetchHistory()]);
    setRefreshing(false);
  };

  const isLoading = balanceLoading || expiringLoading || historyLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading TOIL data...</Text>
      </View>
    );
  }

  const balance = balanceData?.balance ?? 0;
  const balanceInDays = balanceData?.balanceInDays ?? "0.0";
  const expiringHours = expiringData?.totalExpiringHours ?? 0;
  const expiringDays = expiringData?.totalExpiringDays ?? "0.0";
  const expiringRecords = expiringData?.expiringToil ?? [];
  const recentHistory = historyData?.history ?? [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TOIL Balance</Text>
          <Text style={styles.headerSubtitle}>Time Off In Lieu</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Current Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{balance}</Text>
              <Text style={styles.balanceUnit}>hours</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{balanceInDays}</Text>
              <Text style={styles.balanceUnit}>days</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              TOIL is earned through approved overtime. 7.5 hours = 1 day of
              leave.
            </Text>
          </View>
        </View>

        {/* Expiring TOIL Warning */}
        {expiringHours > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Expiring Soon</Text>
            <Text style={styles.warningText}>
              {expiringDays} days ({expiringHours}h) of TOIL will expire in the
              next 30 days
            </Text>
            <Text style={styles.warningSubtext}>
              Use your TOIL before it expires!
            </Text>
            {expiringRecords.length > 0 && (
              <View style={styles.expiringList}>
                {expiringRecords.map((record) => (
                  <View key={record.id} style={styles.expiringItem}>
                    <Text style={styles.expiringHours}>
                      {record.hoursAccrued}h
                    </Text>
                    <Text style={styles.expiringDate}>
                      Expires: {formatDate(record.expiryDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recent Accruals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Accruals</Text>
            {recentHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("TOILHistory")}
              >
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No TOIL accrued yet</Text>
              <Text style={styles.emptySubtext}>
                TOIL is automatically earned when you log overtime hours that
                are approved by your manager
              </Text>
            </View>
          ) : (
            recentHistory.map((record) => (
              <View key={record.id} style={styles.accrualCard}>
                <View style={styles.accrualHeader}>
                  <Text style={styles.accrualHours}>
                    +{record.hoursAccrued}h
                  </Text>
                  {record.expired && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredText}>Expired</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.accrualDetail}>
                  Week ending: {formatDate(record.weekEnding)}
                </Text>
                <Text style={styles.accrualDetail}>
                  Logged: {record.loggedHours}h / Contracted:{" "}
                  {record.contractedHours}h
                </Text>
                <Text style={styles.accrualExpiry}>
                  {record.expired
                    ? `Expired: ${formatDate(record.expiryDate)}`
                    : `Expires: ${formatDate(record.expiryDate)}`}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>About TOIL</Text>
          <Text style={styles.infoSectionText}>
            • TOIL is earned when you work overtime hours beyond your contracted
            hours
          </Text>
          <Text style={styles.infoSectionText}>
            • Overtime must be approved by your manager to accrue TOIL
          </Text>
          <Text style={styles.infoSectionText}>
            • TOIL expires after 6 months from the week it was earned
          </Text>
          <Text style={styles.infoSectionText}>
            • You can use TOIL by requesting leave with type "TOIL"
          </Text>
        </View>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceItem: {
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  balanceUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  balanceDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },
  warningCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    color: "#92400e",
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 14,
    color: "#92400e",
    fontStyle: "italic",
  },
  expiringList: {
    marginTop: 12,
  },
  expiringItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#fde68a",
  },
  expiringHours: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  expiringDate: {
    fontSize: 14,
    color: "#92400e",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  accrualCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  accrualHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accrualHours: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
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
  accrualDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  accrualExpiry: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  infoBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#0369a1",
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoSectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
