export type RedemptionStatus = 'pending' | 'approved' | 'sent' | 'cancelled';

export interface RewardRedemptionSummary {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  phoneMasked: string;
  status: RedemptionStatus;
  createdAt: string;
}

export function normalizeKoreanPhone(value: unknown) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : null;
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`;
}

function encryptionKey(secret: string) {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptPhone(phone: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptPhone(payload: Uint8Array, secret: string) {
  const data = Buffer.from(payload);
  if (data.length < 29) throw new Error('INVALID_ENCRYPTED_PHONE');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8');
}
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
