import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Authenticated encryption prevents undetected token/key tampering. Format: v1:iv:tag:ciphertext.
function getKey() {
  const value = process.env.ENCRYPTION_KEY;
  if (!value || Buffer.byteLength(value, 'utf8') !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 UTF-8 bytes');
  }
  return Buffer.from(value, 'utf8');
}

export function encrypt(text) {
  if (typeof text !== 'string' || !text) throw new Error('Cannot encrypt an empty value');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}

export function decrypt(encryptedText) {
  const [version, ivText, tagText, ciphertextText, extra] = String(encryptedText).split(':');
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText || extra) {
    throw new Error('Invalid encrypted value format');
  }
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
