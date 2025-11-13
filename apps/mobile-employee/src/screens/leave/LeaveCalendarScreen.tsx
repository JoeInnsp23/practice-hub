import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Calendar, toDateId } from "@marceloterreiro/flash-calendar";
import { trpc } from "@/lib/trpc";

interface LeaveEntry {
  id: string;
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  daysCount: number;
}

export default function LeaveCalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [refreshing, setRefreshing] = useState(false);

  // Fetch team leave data (approved and pending for next 6 months)
  const today = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(today.getMonth() + 6);

  const { data: leaveData, isLoading, refetch } = trpc.leave.getTeamLeave.useQuery({
    startDate: today.toISOString().split("T")[0],
    endDate: sixMonthsLater.toISOString().split("T")[0],
  });

  // Process leave data into calendar format
  const markedDates = useMemo(() => {
    if (!leaveData?.requests) return {};

    const marked: Record<
      string,
      { marked: boolean; dotColor: string; entries: LeaveEntry[] }
    > = {};

    leaveData.requests.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Mark each date in the leave range
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateStr = date.toISOString().split("T")[0];

        if (!marked[dateStr]) {
          marked[dateStr] = {
            marked: true,
            dotColor: leave.status === "approved" ? "#22c55e" : "#f59e0b",
            entries: [],
          };
        }

        marked[dateStr].entries.push({
          id: leave.id,
          userName: leave.userName,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status: leave.status,
          daysCount: leave.daysCount,
        });
      }
    });

    return marked;
  }, [leaveData]);

  // Get entries for selected date
  const selectedDateEntries = markedDates[selectedDate]?.entries || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatLeaveType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (start === end) {
      return startDate.toLocaleDateString("en-US", options);
    }

    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading team calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>Approved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          calendarActiveDateRanges={Object.keys(markedDates).map((date) => ({
            startId: toDateId(new Date(date)),
            endId: toDateId(new Date(date)),
          }))}
          onCalendarDayPress={(dateId) => {
            setSelectedDate(dateId);
          }}
          theme={{
            rowMonth: {
              content: {
                fontSize: 18,
                fontWeight: "600",
                color: "#1f2937",
              },
            },
            rowWeek: {
              container: {
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
                paddingVertical: 8,
              },
            },
            itemWeekName: {
              content: {
                fontSize: 12,
                fontWeight: "600",
                color: "#6b7280",
              },
            },
            itemDay: {
              idle: ({ isPressed }) => ({
                container: {
                  backgroundColor: isPressed ? "#f3f4f6" : "transparent",
                  borderRadius: 8,
                },
                content: {
                  color: "#1f2937",
                },
              }),
              today: ({ isPressed }) => ({
                container: {
                  backgroundColor: isPressed ? "#dbeafe" : "#eff6ff",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#3b82f6",
                },
                content: {
                  color: "#3b82f6",
                  fontWeight: "600",
                },
              }),
              active: ({ isPressed }) => ({
                container: {
                  backgroundColor: isPressed ? "#dbeafe" : "#3b82f6",
                  borderRadius: 8,
                },
                content: {
                  color: "#ffffff",
                  fontWeight: "600",
                },
              }),
            },
          }}
        />
      </View>

      {/* Selected Date Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>
          {new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>

        {selectedDateEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No leave scheduled</Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {selectedDateEntries.map((entry) => (
              <View
                key={`${entry.id}-${entry.startDate}`}
                style={styles.entryCard}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryUserName}>{entry.userName}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      entry.status === "approved"
                        ? styles.statusApproved
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        entry.status === "approved"
                          ? styles.statusTextApproved
                          : styles.statusTextPending,
                      ]}
                    >
                      {entry.status.charAt(0).toUpperCase() +
                        entry.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.entryDetails}>
                  <Text style={styles.entryLeaveType}>
                    {formatLeaveType(entry.leaveType)}
                  </Text>
                  <Text style={styles.entryDateRange}>
                    {formatDateRange(entry.startDate, entry.endDate)}
                  </Text>
                  <Text style={styles.entryDaysCount}>
                    {entry.daysCount} {entry.daysCount === 1 ? "day" : "days"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#6b7280",
  },
  calendarContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailsContainer: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: "#dcfce7",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextApproved: {
    color: "#16a34a",
  },
  statusTextPending: {
    color: "#ca8a04",
  },
  entryDetails: {
    gap: 4,
  },
  entryLeaveType: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "500",
  },
  entryDateRange: {
    fontSize: 14,
    color: "#6b7280",
  },
  entryDaysCount: {
    fontSize: 14,
    color: "#6b7280",
  },
});
