import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
const databasePath = resolve(process.env.SQLITE_PATH?.trim() || 'database/jeongo.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath, { timeout: 5_000 });
database.exec('PRAGMA foreign_keys = ON');
database.exec('PRAGMA journal_mode = WAL');
database.exec('PRAGMA synchronous = NORMAL');
database.exec('PRAGMA busy_timeout = 5000');
database.exec(readFileSync(resolve('database/sqlite-schema.sql'), 'utf8'));
const integrity = database.prepare('PRAGMA integrity_check').get();
database.close();

if (integrity?.integrity_check !== 'ok') throw new Error(`SQLite integrity check failed: ${String(integrity?.integrity_check)}`);
console.log(`SQLite database "${databasePath}" is ready and passed integrity_check.`);
