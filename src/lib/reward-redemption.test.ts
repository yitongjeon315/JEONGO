import { describe, expect, it } from 'vitest';
import { maskPhone, normalizeKoreanPhone } from './reward-redemption';

describe('reward redemption', () => {
  it('normalizes valid Korean mobile numbers', () => {
    expect(normalizeKoreanPhone('010-1234-5678')).toBe('01012345678');
    expect(normalizeKoreanPhone('021234567')).toBeNull();
  });

  it('masks phone numbers', () => {
    expect(maskPhone('01012345678')).toBe('010-****-5678');
  });
});
