import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

/**
 * Quick time entry screen - log time quickly
 * Matches web: app/employee-hub/time-entries/page.tsx
 */
export function QuickEntryScreen() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [workType, setWorkType] = useState("WORK");
  const [billable, setBillable] = useState(true);

  const utils = trpc.useUtils();
  const createEntry = trpc.timesheets.create.useMutation({
    onSuccess: () => {
      // Invalidate timesheets list to refetch
      utils.timesheets.list.invalidate();

      Alert.alert("Success", "Time entry logged successfully");

      // Reset form
      setHours("");
      setDescription("");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    // Validate
    if (!hours || Number.parseFloat(hours) <= 0) {
      Alert.alert("Validation Error", "Please enter valid hours");
      return;
    }

    if (!description || description.trim().length === 0) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }

    createEntry.mutate({
      date,
      hours: hours.toString(),
      description: description.trim(),
      workType,
      billable,
      status: "draft",
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Log Time</Text>
          <Text style={styles.subtitle}>Quickly log your time entry</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="default"
          />

          <Input
            label="Hours"
            value={hours}
            onChangeText={setHours}
            placeholder="e.g., 2.5"
            keyboardType="decimal-pad"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What did you work on?"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Work Type</Text>
            <View style={styles.workTypeButtons}>
              <Button
                title="Work"
                variant={workType === "WORK" ? "primary" : "outline"}
                onPress={() => setWorkType("WORK")}
                style={styles.workTypeButton}
              />
              <Button
                title="TOIL"
                variant={workType === "TOIL" ? "primary" : "outline"}
                onPress={() => setWorkType("TOIL")}
                style={styles.workTypeButton}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Billable</Text>
            <View style={styles.workTypeButtons}>
              <Button
                title="Billable"
                variant={billable ? "primary" : "outline"}
                onPress={() => setBillable(true)}
                style={styles.workTypeButton}
              />
              <Button
                title="Non-billable"
                variant={!billable ? "primary" : "outline"}
                onPress={() => setBillable(false)}
                style={styles.workTypeButton}
              />
            </View>
          </View>

          <Button
            title="Log Time"
            onPress={handleSubmit}
            loading={createEntry.isPending}
            disabled={createEntry.isPending}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  workTypeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  workTypeButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
  },
});
