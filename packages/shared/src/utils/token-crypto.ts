import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getPublishConfig } from "../config/publish.js";

const ALGORITHM = "aes-256-gcm";

const getKey = (): Buffer => {
  const config = getPublishConfig();
  const secret = config.tokenEncryptionKey;
  if (secret === undefined || secret === "") {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY or AUTH_SECRET required for token encryption",
    );
  }
  return createHash("sha256").update(secret).digest();
};

export const encryptToken = (plaintext: string): string => {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptToken = (ciphertext: string): string => {
  const key = getKey();
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
};
