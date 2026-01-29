import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(process.env.REPORT_ENCRYPTION_KEY!, 'hex');

export function encryptBuffer(buffer: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag(); // ✅ MUST be 16 bytes

  return { encrypted, iv, tag };
}

export function decryptBuffer(
  encrypted: Buffer,
  iv: Buffer,
  tag: Buffer
) {
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}
