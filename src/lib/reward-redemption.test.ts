import { describe, expect, it } from 'vitest';
import { decryptPhone, encryptPhone, maskPhone, normalizeKoreanPhone } from './reward-redemption';

describe('reward redemption', () => {
  it('normalizes valid Korean mobile numbers', () => {
    expect(normalizeKoreanPhone('010-1234-5678')).toBe('01012345678');
    expect(normalizeKoreanPhone('021234567')).toBeNull();
  });

  it('masks phone numbers', () => {
    expect(maskPhone('01012345678')).toBe('010-****-5678');
  });

  it('encrypts phone numbers with authenticated encryption', () => {
    const secret = 'a-long-test-secret-with-24-characters';
    const encrypted = encryptPhone('01012345678', secret);
    expect(Buffer.from(encrypted).includes(Buffer.from('01012345678'))).toBe(false);
    expect(decryptPhone(encrypted, secret)).toBe('01012345678');
    expect(() => decryptPhone(encrypted, 'a-different-long-test-secret-key')).toThrow();
  });
});
