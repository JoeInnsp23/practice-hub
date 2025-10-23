/**
 * Encryption Service - AES-256-GCM for credential storage
 *
 * CRITICAL: This service requires ENCRYPTION_KEY environment variable
 * Generate with: openssl rand -hex 32
 *
 * Used for encrypting:
 * - Integration credentials (OAuth tokens, API keys)
 * - Sensitive configuration data
 */

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const ENCODING: BufferEncoding = "hex";

/**
 * Get encryption key from environment variable
 * Throws error if not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate with: openssl rand -hex 32",
    );
  }

  // Convert hex string to Buffer (should be 32 bytes = 256 bits)
  const keyBuffer = Buffer.from(key, ENCODING);

  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes (64 hex characters). Current length: ${keyBuffer.length} bytes`,
    );
  }

  return keyBuffer;
}

/**
 * Encrypt text using AES-256-GCM
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData (all hex-encoded)
 *
 * @example
 * const encrypted = encrypt(JSON.stringify({ apiKey: 'secret' }));
 * // Returns: "a1b2c3....:d4e5f6....:g7h8i9...."
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();

    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", ENCODING);
    encrypted += cipher.final(ENCODING);

    // Get authentication tag (GCM mode provides this)
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData (all hex-encoded)
    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
    throw new Error("Encryption failed with unknown error");
  }
}

/**
 * Decrypt text encrypted with AES-256-GCM
 *
 * @param encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 *
 * @throws Error if decryption fails or data is tampered
 *
 * @example
 * const decrypted = decrypt(encrypted);
 * const credentials = JSON.parse(decrypted);
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted string into components
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
      throw new Error(
        "Invalid encrypted text format. Expected format: iv:authTag:encryptedData",
      );
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to Buffers
    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(
        `Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`,
      );
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`,
      );
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set the authentication tag (MUST be called before update/final)
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, ENCODING, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      // Authentication tag mismatch indicates tampering
      if (
        error.message.includes(
          "Unsupported state or unable to authenticate data",
        )
      ) {
        throw new Error(
          "Decryption failed: Data may have been tampered with or encryption key is incorrect",
        );
      }
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error("Decryption failed with unknown error");
  }
}

/**
 * Encrypt an object as JSON
 *
 * @param obj - Object to encrypt
 * @returns Encrypted string
 *
 * @example
 * const encrypted = encryptObject({ accessToken: 'token123', refreshToken: 'refresh456' });
 */
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
): string {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypt a string back to an object
 *
 * @param encryptedText - Encrypted string
 * @returns Decrypted object
 *
 * @example
 * const credentials = decryptObject<XeroCredentials>(encrypted);
 * console.log(credentials.accessToken);
 */
export function decryptObject<T extends Record<string, unknown>>(
  encryptedText: string,
): T {
  const json = decrypt(encryptedText);
  return JSON.parse(json) as T;
}

/**
 * Utility to validate encryption key format
 * Useful for startup checks
 *
 * @returns true if encryption key is valid, throws error otherwise
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid encryption key configuration");
  }
}
