import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { TRPCProvider } from "./src/providers/TRPCProvider";
import { ClientsScreen } from "./src/screens/ClientsScreen";

/**
 * Practice Hub Employee - Mobile App
 * Demonstrates monorepo setup with shared types and tRPC
 */
export default function App() {
  return (
    <TRPCProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <ClientsScreen />
      </SafeAreaView>
    </TRPCProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
});
