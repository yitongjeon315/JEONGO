import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function loadLocalEnv() {
  const envPath = resolve('.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] ??= value;
  }
}

loadLocalEnv();
const email = String(process.argv[2] ?? '').trim().toLowerCase();
const requestedName = String(process.argv[3] ?? email.split('@')[0]).trim().slice(0, 40);
if (!/^[^\s@]+@gmail\.com$/.test(email)) throw new Error('A valid Gmail address is required.');
const name = requestedName.length >= 2 ? requestedName : email.split('@')[0].slice(0, 40);
const databasePath = resolve(process.env.SQLITE_PATH?.trim() || 'database/jeongo.sqlite');
const database = new DatabaseSync(databasePath, { timeout: 5_000 });
database.exec('PRAGMA foreign_keys = ON');
database.exec('BEGIN IMMEDIATE');
try {
  const existing = database.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(email);
  if (existing) {
    database.prepare(`UPDATE users SET role = 'admin', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(existing.id);
  } else {
    database.prepare(`INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, 'oauth$google-only', ?, 'admin')`).run(randomUUID(), email, name);
  }
  database.exec('COMMIT');
} catch (error) {
  database.exec('ROLLBACK');
  throw error;
} finally {
  database.close();
}
console.log(`Google administrator is ready: ${email}`);
