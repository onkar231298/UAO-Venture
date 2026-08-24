import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const CREDENTIAL_KEY_INFO = "bright-organic/email-provider-credentials/v1";
const ENVELOPE_VERSION = "v1";

function credentialKey(): Buffer {
  const material =
    process.env.EMAIL_CREDENTIALS_ENCRYPTION_KEY || process.env.SESSION_SECRET;

  if (!material) {
    throw new Error(
      "Email credential encryption is not configured: set EMAIL_CREDENTIALS_ENCRYPTION_KEY (preferred) or SESSION_SECRET before using email providers.",
    );
  }

  // HKDF domain separation ensures this key cannot be reused as the session key.
  return Buffer.from(
    hkdfSync("sha256", Buffer.from(material, "utf8"), Buffer.alloc(0), CREDENTIAL_KEY_INFO, 32),
  );
}

/**
 * Encrypt a provider app password for database storage. The value is
 * self-contained and versioned: v1.base64url(iv).base64url(tag).base64url(data).
 */
export function encryptEmailCredential(credential: string): string {
  if (!credential) {
    throw new Error("Cannot encrypt an empty email credential");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", credentialKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(credential, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENVELOPE_VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/** Decrypt only in a server-side provider operation; never serialize its result. */
export function decryptEmailCredential(envelope: string): string {
  const [version, ivText, tagText, ciphertextText, ...rest] = envelope.split(".");
  if (
    version !== ENVELOPE_VERSION ||
    !ivText ||
    !tagText ||
    !ciphertextText ||
    rest.length > 0
  ) {
    throw new Error("Invalid encrypted email credential envelope");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      credentialKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    throw new Error(
      `Unable to decrypt email credential: ${error instanceof Error ? error.message : "invalid ciphertext"}`,
    );
  }
}

/** Allows boot-time configuration validation where the application chooses. */
export function assertEmailCredentialEncryptionConfigured(): void {
  credentialKey();
}