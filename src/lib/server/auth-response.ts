import { isDatabaseConfigured } from './db';
import { getCurrentUser, type AuthUser } from './session';

export function publicUser(user: AuthUser) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function optionalCurrentUser() {
  if (!isDatabaseConfigured()) return null;
  return getCurrentUser();
}
