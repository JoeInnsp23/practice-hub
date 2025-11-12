import { createStackNavigator } from "@react-navigation/stack";
import { SignInScreen } from "../screens/auth/SignInScreen";
import type { AuthStackParamList } from "./types";

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Authentication navigation stack
 * Handles sign in, sign up, and password reset flows
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#f8fafc" },
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      {/* TODO: Add SignUp and ForgotPassword screens */}
    </Stack.Navigator>
  );
}
