import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";
const STORED_EMAIL_KEY = "biometric_email";

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
}

/**
 * Check if biometric credentials are enrolled on device
 */
export async function hasBiometricCredentials(): Promise<boolean> {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get available biometric types
 * Returns: FaceID, TouchID, Fingerprint, Iris, etc.
 */
export async function getAvailableBiometricTypes(): Promise<
  LocalAuthentication.AuthenticationType[]
> {
  return await LocalAuthentication.supportedAuthenticationTypesAsync();
}

/**
 * Get user-friendly name for biometric type
 */
export function getBiometricTypeName(
  types: LocalAuthentication.AuthenticationType[],
): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Touch ID / Fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris Scan";
  }
  return "Biometric";
}

/**
 * Authenticate using biometric
 * @param reason - Reason shown to user (iOS)
 * @returns {Promise<boolean>} True if authentication successful
 */
export async function authenticateWithBiometric(
  reason = "Authenticate to access your account",
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false, // Allow fallback to device passcode
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
}

/**
 * Check if biometric authentication is enabled for this app
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return enabled === "true";
}

/**
 * Enable biometric authentication
 * Stores user's email for future biometric logins
 */
export async function enableBiometric(email: string): Promise<boolean> {
  try {
    // Verify biometric auth works before enabling
    const success = await authenticateWithBiometric(
      "Verify your identity to enable biometric login",
    );

    if (success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      await SecureStore.setItemAsync(STORED_EMAIL_KEY, email);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to enable biometric:", error);
    return false;
  }
}

/**
 * Disable biometric authentication
 * Removes stored email
 */
export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  await SecureStore.deleteItemAsync(STORED_EMAIL_KEY);
}

/**
 * Get stored email for biometric login
 */
export async function getStoredEmail(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORED_EMAIL_KEY);
}

/**
 * Complete flow: Check if biometric is available and enabled,
 * then attempt authentication
 */
export async function attemptBiometricLogin(): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  // Check if device supports biometric
  const supported = await isBiometricSupported();
  if (!supported) {
    return {
      success: false,
      error: "Biometric authentication not supported on this device",
    };
  }

  // Check if biometric credentials are enrolled
  const enrolled = await hasBiometricCredentials();
  if (!enrolled) {
    return {
      success: false,
      error: "No biometric credentials enrolled on this device",
    };
  }

  // Check if biometric is enabled in app
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: false, error: "Biometric login not enabled" };
  }

  // Get stored email
  const email = await getStoredEmail();
  if (!email) {
    return { success: false, error: "No stored credentials found" };
  }

  // Authenticate
  const authenticated = await authenticateWithBiometric(
    "Login to Practice Hub",
  );

  if (authenticated) {
    return { success: true, email };
  }

  return { success: false, error: "Biometric authentication failed" };
}
