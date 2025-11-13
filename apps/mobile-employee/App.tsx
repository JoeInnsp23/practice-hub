import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { TRPCProvider } from "./src/providers/TRPCProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useNotifications } from "./src/hooks/useNotifications";

/**
 * Practice Hub Employee - Mobile App
 * Full-featured mobile app with authentication and navigation
 */
export default function App() {
  // Initialize push notifications
  useNotifications();

  return (
    <TRPCProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </TRPCProvider>
  );
}
