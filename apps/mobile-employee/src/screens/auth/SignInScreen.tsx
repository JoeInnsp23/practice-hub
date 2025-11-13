import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../lib/colors";
import {
  isBiometricSupported,
  hasBiometricCredentials,
  getAvailableBiometricTypes,
  getBiometricTypeName,
  attemptBiometricLogin,
  enableBiometric,
  isBiometricEnabled as checkBiometricEnabled,
} from "../../lib/biometric";

/**
 * Sign In screen for Employee Hub
 * Uses Better Auth for authentication
 */
export function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const supported = await isBiometricSupported();
    const enrolled = await hasBiometricCredentials();
    const enabled = await checkBiometricEnabled();

    if (supported && enrolled) {
      const types = await getAvailableBiometricTypes();
      const typeName = getBiometricTypeName(types);
      setBiometricType(typeName);
      setBiometricAvailable(true);
      setBiometricEnabled(enabled);
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);

      if (!result.success) {
        Alert.alert("Sign In Failed", result.error || "Please try again");
        return;
      }

      // Offer to enable biometric after successful login
      if (biometricAvailable && !biometricEnabled) {
        Alert.alert(
          "Enable Biometric Login?",
          `Would you like to enable ${biometricType} for faster sign-in?`,
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const success = await enableBiometric(email);
                if (success) {
                  Alert.alert(
                    "Success",
                    `${biometricType} login enabled`,
                  );
                  setBiometricEnabled(true);
                }
              },
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const result = await attemptBiometricLogin();

      if (result.success && result.email) {
        // Get password from secure storage if stored
        // For now, we need to sign in with stored credentials
        // NOTE: This is a simplified flow. In production, you might want to:
        // 1. Store encrypted credentials
        // 2. Use biometric to unlock stored session
        // 3. Implement refresh tokens
        Alert.alert(
          "Biometric Success",
          "Authenticated successfully. Please enter your password to complete sign-in.",
        );
        setEmail(result.email);
      } else {
        Alert.alert(
          "Biometric Failed",
          result.error || "Biometric authentication failed",
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to your Practice Hub account
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
          />

          {biometricAvailable && biometricEnabled && (
            <Button
              title={`Sign in with ${biometricType}`}
              variant="secondary"
              onPress={handleBiometricLogin}
              disabled={loading}
              style={styles.biometricButton}
            />
          )}

          <Button
            title="Forgot Password?"
            variant="ghost"
            onPress={() => {
              // TODO: Navigate to forgot password screen
              Alert.alert("Coming Soon", "Forgot password feature coming soon");
            }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Practice Hub Employee • Version 1.0.0
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
  },
  biometricButton: {
    marginTop: 12,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
