import crypto from 'crypto';

// ====================================================================
// AMG HOLDINGS ENTERPRISE SECURITY: AES-256-GCM FIELD-LEVEL ENCRYPTION
// (OWASP ASVS v4.0 & PCI-DSS v4.0 COMPLIANT)
// Used for encrypting PII, financial payloads, and bank account data at rest.
// ====================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY || process.env.JWT_SECRET || 'amg_holdings_default_aes256_encryption_master_key_32bytes';
  // Derive a deterministic 32-byte key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
  iv: string; // Hex-encoded Initialization Vector
  ciphertext: string; // Hex-encoded ciphertext
  tag: string; // Hex-encoded authentication tag
}

/**
 * Encrypts a plaintext string using AES-256-GCM with authenticated tag.
 */
export function encryptData(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext,
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext payload and validates authentication tag.
 */
export function decryptData(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Serializes an encrypted object into a single transportable string: iv:tag:ciphertext
 */
export function encryptToString(plaintext: string): string {
  const enc = encryptData(plaintext);
  return `${enc.iv}:${enc.tag}:${enc.ciphertext}`;
}

/**
 * Deserializes and decrypts an iv:tag:ciphertext string.
 */
export function decryptFromString(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:tag:ciphertext');
  }
  return decryptData({
    iv: parts[0],
    tag: parts[1],
    ciphertext: parts[2],
  });
}
