import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";

/**
 * Leave request form screen - create new leave requests
 * Matches web: app/employee-hub/leave/request/page.tsx
 */

type LeaveType = "annual_leave" | "sick_leave" | "toil" | "unpaid" | "other";

export function LeaveRequestFormScreen() {
  const [leaveType, setLeaveType] = useState<LeaveType>("annual_leave");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const utils = trpc.useUtils();
  const createRequest = trpc.leave.request.useMutation({
    onSuccess: () => {
      utils.leave.getHistory.invalidate();
      utils.leave.getBalance.invalidate();
      Alert.alert(
        "Success",
        "Leave request submitted successfully",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setLeaveType("annual_leave");
              setStartDate(new Date());
              setEndDate(new Date());
              setNotes("");
            },
          },
        ],
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date if it's before start date
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const calculateWorkingDays = (): number => {
    // Simple working days calculation (excludes weekends)
    // Backend will handle bank holidays and exact calculation
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const workingDays = calculateWorkingDays();

  const handleSubmit = () => {
    // Validation
    if (startDate > endDate) {
      Alert.alert("Error", "End date must be on or after start date");
      return;
    }

    if (workingDays === 0) {
      Alert.alert(
        "Error",
        "Leave request must include at least one working day",
      );
      return;
    }

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      Alert.alert("Error", "Cannot request leave for past dates");
      return;
    }

    createRequest.mutate({
      leaveType,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Leave Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={leaveType}
            onValueChange={(value) => setLeaveType(value as LeaveType)}
            style={styles.picker}
          >
            <Picker.Item label="Annual Leave" value="annual_leave" />
            <Picker.Item label="Sick Leave" value="sick_leave" />
            <Picker.Item label="TOIL" value="toil" />
            <Picker.Item label="Unpaid Leave" value="unpaid" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.sectionTitle}>Start Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {startDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.sectionTitle}>End Date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {endDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}

        <View style={styles.workingDaysContainer}>
          <Text style={styles.workingDaysLabel}>Working Days:</Text>
          <Text style={styles.workingDaysValue}>{workingDays}</Text>
        </View>
        <Text style={styles.helperText}>
          Weekends and bank holidays are automatically excluded
        </Text>

        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional details..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Button
          title="Submit Request"
          variant="primary"
          onPress={handleSubmit}
          loading={createRequest.isPending}
          disabled={createRequest.isPending || workingDays === 0}
          style={styles.submitButton}
        />

        {leaveType === "annual_leave" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Annual leave will be deducted from your balance once approved by
              your manager
            </Text>
          </View>
        )}

        {leaveType === "toil" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              TOIL (Time Off In Lieu) will be deducted from your TOIL balance
              once approved. 1 day = 7.5 hours
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formContainer: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  picker: {
    color: COLORS.textPrimary,
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  workingDaysContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 16,
  },
  workingDaysLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  workingDaysValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 100,
  },
  submitButton: {
    marginTop: 24,
  },
  infoBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#0369a1",
    lineHeight: 20,
  },
});
