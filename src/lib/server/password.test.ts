// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies the original password without storing it as plain text', async () => {
    const hash = await hashPassword('correct-horse-42');
    expect(hash).not.toContain('correct-horse-42');
    await expect(verifyPassword('correct-horse-42', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed stored hashes', async () => {
    await expect(verifyPassword('anything', 'not-a-valid-hash')).resolves.toBe(false);
  });
});
