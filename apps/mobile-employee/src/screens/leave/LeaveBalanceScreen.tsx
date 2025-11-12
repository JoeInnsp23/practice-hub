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
import { Button } from "../../components/ui/Button";
import type { LeaveStackParamList } from "../../navigation/types";

type LeaveBalanceScreenNavigationProp = StackNavigationProp<
  LeaveStackParamList,
  "LeaveBalance"
>;

type Props = {
  navigation: LeaveBalanceScreenNavigationProp;
};

/**
 * Leave balance screen - shows annual leave, TOIL, and sick leave balances
 * Matches web: app/employee-hub/leave/balance/page.tsx
 */
export function LeaveBalanceScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data, isLoading, error, refetch } = trpc.leave.getBalance.useQuery({
    year: currentYear,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading balances...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading balances</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <Button title="Try Again" onPress={() => refetch()} />
      </View>
    );
  }

  const balance = data?.balance;
  const annualRemaining = data?.annualRemaining ?? 0;

  const annualEntitlement = balance?.annualEntitlement ?? 0;
  const annualUsed = balance?.annualUsed ?? 0;
  const carriedOver = balance?.carriedOver ?? 0;
  const sickUsed = balance?.sickUsed ?? 0;
  const toilBalance = balance?.toilBalance ?? 0;

  // Convert TOIL hours to days (7.5 hours = 1 day)
  const toilDays = (toilBalance / 7.5).toFixed(1);

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
          <Text style={styles.headerTitle}>Leave Balances</Text>
          <Text style={styles.headerSubtitle}>{currentYear}</Text>
        </View>

        {/* Annual Leave Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Annual Leave</Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Entitlement</Text>
            <Text style={styles.balanceValue}>{annualEntitlement} days</Text>
          </View>

          {carriedOver > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Carried Over</Text>
              <Text style={[styles.balanceValue, styles.accentText]}>
                +{carriedOver} days
              </Text>
            </View>
          )}

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Used</Text>
            <Text style={styles.balanceValue}>{annualUsed} days</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.balanceRow}>
            <Text style={styles.remainingLabel}>Remaining</Text>
            <Text style={styles.remainingValue}>
              {annualRemaining} days
            </Text>
          </View>

          {annualRemaining <= 5 && annualRemaining > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                You have {annualRemaining} days remaining. Consider booking your
                leave soon.
              </Text>
            </View>
          )}

          {annualRemaining === 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>
                You have no annual leave remaining.
              </Text>
            </View>
          )}
        </View>

        {/* TOIL Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>TOIL Balance</Text>
            <Text style={styles.cardSubtitle}>Time Off In Lieu</Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Hours</Text>
            <Text style={styles.balanceValue}>{toilBalance}h</Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Days</Text>
            <Text style={styles.balanceValue}>{toilDays} days</Text>
          </View>

          {toilBalance > 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                TOIL is earned through approved overtime. 7.5 hours = 1 day of
                leave.
              </Text>
            </View>
          )}

          {toilBalance === 0 && (
            <View style={styles.neutralBox}>
              <Text style={styles.neutralText}>
                You have no TOIL balance. TOIL is earned through approved
                overtime hours.
              </Text>
            </View>
          )}
        </View>

        {/* Sick Leave Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sick Leave</Text>
            <Text style={styles.cardSubtitle}>Statutory sick leave</Text>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Used This Year</Text>
            <Text style={styles.balanceValue}>{sickUsed} days</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Sick leave is unlimited but may require certification after 7 days.
              Contact HR for more details.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <Button
          title="Request Leave"
          variant="primary"
          onPress={() => navigation.navigate("LeaveRequestForm")}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  accentText: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  remainingLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  infoBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#0369a1",
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorBoxText: {
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
  },
  neutralBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  neutralText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
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
    marginBottom: 16,
    textAlign: "center",
  },
});
