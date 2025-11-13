import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import type { StackNavigationProp } from "@react-navigation/stack";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";
import type { TimesheetsStackParamList } from "../../navigation/types";

type TimesheetsListScreenNavigationProp = StackNavigationProp<
  TimesheetsStackParamList,
  "TimesheetsList"
>;

type Props = {
  navigation: TimesheetsListScreenNavigationProp;
};

/**
 * Timesheets list screen - shows weekly timesheets
 * Matches web: app/employee-hub/timesheets/page.tsx
 */
export function TimesheetsListScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  // Query timesheets for current user
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.timesheets.list.useQuery({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading timesheets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading timesheets</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <Button title="Try Again" onPress={() => refetch()} />
      </View>
    );
  }

  const timeEntries = data?.timeEntries || [];

  if (timeEntries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No time entries yet</Text>
        <Text style={styles.helperText}>
          Start logging your time to see entries here
        </Text>
        <Button
          title="Log Time"
          variant="primary"
          onPress={() => {
            // TODO: Navigate to time entry
          }}
          style={styles.actionButton}
        />
      </View>
    );
  }

  // Group entries by week for display
  const groupedByWeek = timeEntries.reduce(
    (acc, entry) => {
      const date = new Date(entry.date);
      const weekKey = getWeekKey(date);

      if (!acc[weekKey]) {
        acc[weekKey] = {
          weekKey,
          entries: [],
          totalHours: 0,
        };
      }

      acc[weekKey].entries.push(entry);
      acc[weekKey].totalHours += Number(entry.hours);

      return acc;
    },
    {} as Record<
      string,
      {
        weekKey: string;
        entries: typeof timeEntries;
        totalHours: number;
      }
    >,
  );

  const weeks = Object.values(groupedByWeek).sort(
    (a, b) => b.weekKey.localeCompare(a.weekKey),
  );

  return (
    <FlatList
      style={styles.container}
      data={weeks}
      keyExtractor={(item) => item.weekKey}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.weekCard}
          onPress={() => {
            // TODO: Navigate to week detail
          }}
        >
          <View style={styles.weekHeader}>
            <Text style={styles.weekText}>{item.weekKey}</Text>
            <Text style={styles.hoursText}>{item.totalHours.toFixed(1)}h</Text>
          </View>
          <Text style={styles.entriesCount}>
            {item.entries.length} {item.entries.length === 1 ? "entry" : "entries"}
          </Text>
        </TouchableOpacity>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Timesheets</Text>
          <Text style={styles.headerSubtitle}>
            {timeEntries.length} total entries
          </Text>
          <Button
            title="Submit Timesheet"
            variant="primary"
            onPress={() => navigation.navigate("TimesheetSubmit")}
            style={styles.submitButton}
          />
        </View>
      }
    />
  );
}

function getWeekKey(date: Date): string {
  // Get Monday of the week
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  // Get Sunday of the week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d: Date) => {
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  };

  return `${formatDate(monday)} - ${formatDate(sunday)}`;
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
  submitButton: {
    marginBottom: 8,
  },
  weekCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  hoursText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  entriesCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    marginBottom: 24,
  },
  actionButton: {
    minWidth: 200,
  },
});
