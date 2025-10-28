import { beforeAll, describe, expect, it } from "vitest";
import {
  decrypt,
  decryptObject,
  encrypt,
  encryptObject,
  validateEncryptionKey,
} from "./encryption";

describe("Encryption Service", () => {
  beforeAll(() => {
    // Set a test encryption key (32 bytes = 64 hex characters)
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  describe("validateEncryptionKey", () => {
    it("should validate encryption key successfully", () => {
      expect(validateEncryptionKey()).toBe(true);
    });

    it("should throw error if encryption key is missing", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionKey()).toThrow(
        "ENCRYPTION_KEY environment variable is not set",
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it("should throw error if encryption key is wrong length", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "tooshort";

      expect(() => validateEncryptionKey()).toThrow(
        "ENCRYPTION_KEY must be 32 bytes",
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt text successfully", () => {
      const plainText = "Hello, World!";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it("should produce different ciphertext for same plaintext (different IV)", () => {
      const plainText = "Same text";
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);

      // Different IVs mean different ciphertext
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same plaintext
      expect(decrypt(encrypted1)).toBe(plainText);
      expect(decrypt(encrypted2)).toBe(plainText);
    });

    it("should handle special characters and unicode", () => {
      const plainText = "Special chars: !@#$%^&*()_+{}[]|\\:;\"'<>?,./\n\t™️🔐";
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it("should handle long text", () => {
      const plainText = "A".repeat(10000);
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plainText);
      expect(decrypted.length).toBe(10000);
    });

    it("should throw error for tampered ciphertext", () => {
      const plainText = "Secret data";
      const encrypted = encrypt(plainText);

      // Tamper with the ciphertext
      const parts = encrypted.split(":");
      parts[2] = `${parts[2].slice(0, -2)}ff`; // Change last byte
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow(
        "Data may have been tampered with",
      );
    });

    it("should throw error for invalid format", () => {
      expect(() => decrypt("invalid")).toThrow("Invalid encrypted text format");
      expect(() => decrypt("only:two:parts")).toThrow(); // Will fail on invalid hex or length
    });
  });

  describe("encryptObject and decryptObject", () => {
    it("should encrypt and decrypt simple object", () => {
      const obj = {
        accessToken: "token123",
        refreshToken: "refresh456",
        expiresIn: 3600,
      };

      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it("should encrypt and decrypt nested object", () => {
      const obj = {
        credentials: {
          accessToken: "token123",
          refreshToken: "refresh456",
        },
        config: {
          syncFrequency: "daily",
          enabled: true,
        },
        metadata: {
          lastSync: "2025-01-22T10:00:00Z",
          syncCount: 42,
        },
      };

      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it("should handle empty object", () => {
      const obj = {};
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it("should preserve data types after encryption/decryption", () => {
      const obj = {
        string: "text",
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { key: "value" },
      };

      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
      expect(typeof decrypted.string).toBe("string");
      expect(typeof decrypted.number).toBe("number");
      expect(typeof decrypted.boolean).toBe("boolean");
      expect(decrypted.null).toBeNull();
      expect(Array.isArray(decrypted.array)).toBe(true);
    });
  });

  describe("Real-world use cases", () => {
    it("should encrypt Xero OAuth credentials", () => {
      const credentials = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "def50200a1b2c3d4e5f6...",
        expiresIn: 1800,
        tokenType: "Bearer",
        scope: "accounting.transactions offline_access",
      };

      const encrypted = encryptObject(credentials);
      const decrypted = decryptObject<typeof credentials>(encrypted);

      expect(decrypted).toEqual(credentials);
    });

    it("should encrypt API keys", () => {
      const apiConfig = {
        apiKey: "sk_live_51KZqY2...",
        apiSecret: "whsec_1a2b3c...",
        webhookUrl: "https://example.com/webhooks/stripe",
      };

      const encrypted = encryptObject(apiConfig);
      const decrypted = decryptObject<typeof apiConfig>(encrypted);

      expect(decrypted).toEqual(apiConfig);
    });

    it("should encrypt database connection strings", () => {
      const connectionString =
        "postgresql://user:password@localhost:5432/dbname?sslmode=require";

      const encrypted = encrypt(connectionString);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(connectionString);
    });
  });
});
