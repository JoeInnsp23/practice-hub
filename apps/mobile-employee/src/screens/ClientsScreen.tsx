import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import { trpc } from "@practice-hub/api-client";
import type { Client } from "@practice-hub/shared-types";

/**
 * Example screen showing tRPC usage in React Native
 * This demonstrates type-safe API calls using shared types
 */
export function ClientsScreen() {
  // Type-safe tRPC query - same as web app!
  // const { data: clients, isLoading, error } = trpc.clients.list.useQuery();

  // For demo purposes (since we don't have the actual router set up yet)
  const clients: Client[] = [
    {
      id: "1",
      name: "ABC Manufacturing Ltd",
      email: "contact@abc-mfg.com",
      phone: "+1 555-0100",
      tenantId: "tenant-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "XYZ Services Inc",
      email: "info@xyz-services.com",
      phone: "+1 555-0200",
      tenantId: "tenant-1",
      createdAt: new Date("2024-02-20"),
      updatedAt: new Date("2024-02-20"),
    },
  ];
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading clients...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading clients</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clients ({clients?.length || 0})</Text>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clientCard}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.email && <Text style={styles.clientEmail}>{item.email}</Text>}
            {item.phone && <Text style={styles.clientPhone}>{item.phone}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1e293b",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: "#64748b",
  },
  clientCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: "#64748b",
  },
});
