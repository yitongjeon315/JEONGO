import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONTENT_CATALOG } from '@/lib/content-catalog';

const mocks = vi.hoisted(() => ({
  databaseConfigured: vi.fn(() => true),
  getCurrentUser: vi.fn(),
  getContentCatalog: vi.fn(),
  replaceContentCatalog: vi.fn(),
}));

vi.mock('@/lib/server/db', () => ({ isDatabaseConfigured: mocks.databaseConfigured }));
vi.mock('@/lib/server/session', () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock('@/lib/server/content', () => ({
  getContentCatalog: mocks.getContentCatalog,
  replaceContentCatalog: mocks.replaceContentCatalog,
}));

import { GET, PUT } from './route';

function putRequest(catalog: unknown) {
  return new Request('http://localhost/api/content', {
    method: 'PUT',
    headers: { origin: 'http://localhost', host: 'localhost', 'content-type': 'application/json' },
    body: JSON.stringify({ catalog }),
  });
}

describe('content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.databaseConfigured.mockReturnValue(true);
    mocks.getContentCatalog.mockResolvedValue(DEFAULT_CONTENT_CATALOG);
    mocks.replaceContentCatalog.mockResolvedValue(undefined);
  });

  it('allows everyone to read the shared catalog', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ catalog: DEFAULT_CONTENT_CATALOG });
  });

  it('rejects a save request without login', async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await PUT(putRequest(DEFAULT_CONTENT_CATALOG));
    expect(response.status).toBe(401);
    expect(mocks.replaceContentCatalog).not.toHaveBeenCalled();
  });

  it('rejects a logged-in learner', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', email: 'user@example.com', name: '학습자', role: 'learner' });
    const response = await PUT(putRequest(DEFAULT_CONTENT_CATALOG));
    expect(response.status).toBe(403);
    expect(mocks.replaceContentCatalog).not.toHaveBeenCalled();
  });

  it('lets an admin save a valid catalog', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin' });
    const response = await PUT(putRequest(DEFAULT_CONTENT_CATALOG));
    expect(response.status).toBe(200);
    expect(mocks.replaceContentCatalog).toHaveBeenCalledOnce();
  });

  it('rejects invalid admin input before writing to MySQL', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: '관리자', role: 'admin' });
    const response = await PUT(putRequest({ words: 'invalid', quests: [], rewards: [] }));
    expect(response.status).toBe(400);
    expect(mocks.replaceContentCatalog).not.toHaveBeenCalled();
  });
});
