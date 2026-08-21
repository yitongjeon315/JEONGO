import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = mocks.verifyIdToken;
  },
}));
vi.mock('@/lib/server/db', () => ({
  getDb: () => ({
    getConnection: async () => ({
      execute: mocks.execute,
      beginTransaction: mocks.beginTransaction,
      commit: mocks.commit,
      rollback: mocks.rollback,
      release: mocks.release,
    }),
  }),
}));
vi.mock('@/lib/server/session', () => ({ createSession: mocks.createSession }));

import { POST } from './route';

describe('Google authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
    process.env.GOOGLE_ADMIN_EMAILS = 'yitongjeon315@gmail.com';
  });

  it('links a verified Gmail identity to the pre-registered administrator', async () => {
    mocks.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-subject', email: 'yitongjeon315@gmail.com', email_verified: true, name: 'yitongjeon' }),
    });
    mocks.execute
      .mockResolvedValueOnce([[], undefined])
      .mockResolvedValueOnce([[{ id: 'admin-1', email: 'yitongjeon315@gmail.com', name: 'yitongjeon', role: 'admin' }], undefined])
      .mockResolvedValueOnce([[], { affectedRows: 1 }]);

    const response = await POST(new Request('https://www.aina365.com/api/auth/google', {
      method: 'POST',
      headers: { origin: 'https://www.aina365.com', 'content-type': 'application/json' },
      body: JSON.stringify({ credential: 'signed-google-id-token' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ user: { email: 'yitongjeon315@gmail.com', role: 'admin' }, created: false });
    expect(mocks.createSession).toHaveBeenCalledWith('admin-1');
    expect(mocks.commit).toHaveBeenCalledOnce();
  });

  it('rejects an identity whose email was not verified by Google', async () => {
    mocks.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-subject', email: 'yitongjeon315@gmail.com', email_verified: false }),
    });
    const response = await POST(new Request('https://www.aina365.com/api/auth/google', {
      method: 'POST',
      headers: { origin: 'https://www.aina365.com', 'content-type': 'application/json' },
      body: JSON.stringify({ credential: 'unverified-google-id-token' }),
    }));
    expect(response.status).toBe(403);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it('creates a learner for a verified Google Workspace account', async () => {
    mocks.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'workspace-subject', email: 'learner@example.org', email_verified: true, name: '학습자' }),
    });
    mocks.execute
      .mockResolvedValueOnce([[], undefined])
      .mockResolvedValueOnce([[], undefined])
      .mockResolvedValueOnce([[], { affectedRows: 1 }])
      .mockResolvedValueOnce([[], { affectedRows: 1 }]);

    const response = await POST(new Request('https://www.aina365.com/api/auth/google', {
      method: 'POST',
      headers: { origin: 'https://www.aina365.com', 'content-type': 'application/json' },
      body: JSON.stringify({ credential: 'verified-workspace-id-token' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: { email: 'learner@example.org', name: '학습자', role: 'learner' },
      created: true,
    });
    expect(mocks.createSession).toHaveBeenCalled();
  });
});
