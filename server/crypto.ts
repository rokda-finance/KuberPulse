import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Resolve or generate a persistent 256-bit machine-local encryption key
 * stored in the local data directory with restricted permissions (0600).
 */
function getOrCreateEncryptionKey(dataDir: string): Buffer {
  if (process.env.KUBERPULSE_ENCRYPTION_KEY) {
    return crypto
      .createHash('sha256')
      .update(process.env.KUBERPULSE_ENCRYPTION_KEY)
      .digest();
  }

  fs.mkdirSync(dataDir, { recursive: true });
  const keyPath = path.join(dataDir, '.secret.key');

  if (fs.existsSync(keyPath)) {
    const hex = fs.readFileSync(keyPath, 'utf8').trim();
    const buf = Buffer.from(hex, 'hex');
    if (buf.length === 32) return buf;
  }

  const newKey = crypto.randomBytes(32);
  fs.writeFileSync(keyPath, newKey.toString('hex'), { mode: 0o600 });
  return newKey;
}

export function encryptSecret(plainText: string, dataDir: string): string {
  if (!plainText) return '';
  const key = getOrCreateEncryptionKey(dataDir);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(cipherText: string, dataDir: string): string {
  if (!cipherText || !cipherText.includes(':')) return '';
  try {
    const [ivHex, tagHex, encHex] = cipherText.split(':');
    const key = getOrCreateEncryptionKey(dataDir);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function computeKiteChecksum(apiKey: string, requestToken: string, apiSecret: string): string {
  return crypto
    .createHash('sha256')
    .update(`${apiKey}${requestToken}${apiSecret}`)
    .digest('hex');
}
