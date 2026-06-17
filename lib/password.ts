import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
  if (!passwordHash) return false;

  const [algorithm, salt, storedKey] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !storedKey) return false;

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKeyBuffer = Buffer.from(storedKey, 'hex');

  if (storedKeyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKeyBuffer, derivedKey);
}
