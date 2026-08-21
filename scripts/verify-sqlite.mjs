import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

const databasePath = resolve(process.env.SQLITE_PATH?.trim() || 'database/jeongo.sqlite');
const database = new DatabaseSync(databasePath, { readOnly: true });
database.exec('PRAGMA foreign_keys = ON');

const integrity = database.prepare('PRAGMA integrity_check').get()?.integrity_check;
const foreignKeys = database.prepare('PRAGMA foreign_key_check').all();
const tables = database.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all();
const requiredTables = new Set([
  'account_balances', 'ai_rate_limit_events', 'content_quests', 'content_rewards', 'content_words', 'gold_transactions',
  'guild_members', 'guilds', 'oauth_accounts', 'processed_learning_events', 'reward_redemptions', 'sessions', 'user_snapshots', 'users',
]);
const missing = [...requiredTables].filter((name) => !tables.some((table) => table.name === name));

database.close();
if (integrity !== 'ok') throw new Error(`integrity_check failed: ${String(integrity)}`);
if (foreignKeys.length > 0) throw new Error(`foreign_key_check found ${foreignKeys.length} issue(s)`);
if (missing.length > 0) throw new Error(`missing tables: ${missing.join(', ')}`);
console.log(`SQLite verification passed (${tables.length} tables).`);
