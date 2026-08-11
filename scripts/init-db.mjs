import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadLocalEnv();

const schema = readFileSync(resolve('database/schema.sql'), 'utf8');
const databaseName = process.env.DB_NAME ?? 'jeongo';
const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
const databaseFromUrl = databaseUrl?.pathname.replace(/^\//, '');
if (databaseUrl) databaseUrl.pathname = '/';
const common = databaseUrl
  ? { uri: databaseUrl.toString() }
  : {
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (!process.env.DATABASE_URL && !process.env.DB_USER) {
  throw new Error('.env.local에 DATABASE_URL 또는 DB_USER/DB_PASSWORD/DB_NAME을 설정해 주세요.');
}

const targetDatabase = databaseFromUrl || databaseName;
const adminConnection = await mysql.createConnection({ ...common, multipleStatements: true });
await adminConnection.query(
  `CREATE DATABASE IF NOT EXISTS \`${targetDatabase.replaceAll('`', '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await adminConnection.changeUser({ database: targetDatabase });
await adminConnection.query(schema);
await adminConnection.end();
console.log(`MySQL database "${targetDatabase}" is ready.`);
