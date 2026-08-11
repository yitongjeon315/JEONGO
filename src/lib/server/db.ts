import mysql, { type Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME),
  );
}

export function getDb(): Pool {
  if (pool) return pool;

  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  pool = process.env.DATABASE_URL
    ? mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 10,
        enableKeepAlive: true,
        timezone: 'Z',
      })
    : mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10,
        enableKeepAlive: true,
        timezone: 'Z',
      });

  return pool;
}
