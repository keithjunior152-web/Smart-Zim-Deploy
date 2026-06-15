import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PREFIX = "enc:v1:";
let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.CHAT_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET / CHAT_ENCRYPTION_KEY for chat encryption");
  }
  cachedKey = scryptSync(secret, "smartzim-chat-encryption-v1", 32);
  return cachedKey;
}

export function encryptMessage(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

const DECRYPT_FAILURE_PLACEHOLDER = "[message unavailable]";

export function decryptMessage(stored: string): string {
  // Non-prefixed values are legacy plaintext — return them unchanged for backward compatibility.
  if (typeof stored !== "string" || !stored.startsWith(PREFIX)) return stored;
  try {
    const body = stored.slice(PREFIX.length);
    const [ivB64, tagB64, dataB64] = body.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return DECRYPT_FAILURE_PLACEHOLDER;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Ciphertext present but undecryptable (corruption / key mismatch):
    // never surface the raw enc:v1: blob to the UI or to Claude.
    return DECRYPT_FAILURE_PLACEHOLDER;
  }
}
