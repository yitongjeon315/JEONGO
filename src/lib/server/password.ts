import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, keyValue] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltValue || !keyValue) return false;

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const storedKey = Buffer.from(keyValue, 'base64url');
    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}
