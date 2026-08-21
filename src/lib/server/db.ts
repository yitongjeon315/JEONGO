import 'server-only';

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export interface DatabaseResult {
  affectedRows: number;
  changes: number;
  insertId: number | bigint;
  lastInsertRowid: number | bigint;
}

type DatabaseRow = Record<string, unknown>;
type DatabaseRows = DatabaseRow[];
type QueryParameter = SQLInputValue | Date | boolean | undefined;

class AsyncMutex {
  private tail = Promise.resolve();

  async acquire() {
    let release!: () => void;
    const next = new Promise<void>((resolvePromise) => { release = resolvePromise; });
    const previous = this.tail;
    this.tail = previous.then(() => next);
    await previous;
    return release;
  }
}

function normalizeParameter(value: QueryParameter): SQLInputValue {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value ?? null;
}

function isReadQuery(sql: string) {
  return /^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql);
}

class SqliteExecutor {
  constructor(protected readonly database: DatabaseSync) {}

  protected executeSync<T extends DatabaseRows = DatabaseRows>(sql: string, parameters: QueryParameter[] = []) {
    const statement = this.database.prepare(sql);
    const values = parameters.map(normalizeParameter);
    if (isReadQuery(sql)) return [statement.all(...values) as T, undefined] as const;

    const result = statement.run(...values);
    const metadata: DatabaseResult = {
      affectedRows: Number(result.changes),
      changes: Number(result.changes),
      insertId: result.lastInsertRowid,
      lastInsertRowid: result.lastInsertRowid,
    };
    return [[] as unknown as T, metadata] as const;
  }
}

export class DatabaseConnection extends SqliteExecutor {
  private releaseLock: (() => void) | null = null;
  private transactionActive = false;

  constructor(database: DatabaseSync, private readonly mutex: AsyncMutex) {
    super(database);
  }

  async beginTransaction() {
    if (this.transactionActive) throw new Error('TRANSACTION_ALREADY_ACTIVE');
    this.releaseLock = await this.mutex.acquire();
    try {
      this.database.exec('BEGIN IMMEDIATE');
      this.transactionActive = true;
    } catch (error) {
      this.releaseLock();
      this.releaseLock = null;
      throw error;
    }
  }

  async execute<T extends DatabaseRows = DatabaseRows>(sql: string, parameters: QueryParameter[] = []) {
    if (!this.transactionActive) throw new Error('TRANSACTION_NOT_ACTIVE');
    return this.executeSync<T>(sql, parameters);
  }

  async commit() {
    if (!this.transactionActive) return;
    try {
      this.database.exec('COMMIT');
    } finally {
      this.transactionActive = false;
      this.releaseLock?.();
      this.releaseLock = null;
    }
  }

  async rollback() {
    if (!this.transactionActive) return;
    try {
      this.database.exec('ROLLBACK');
    } finally {
      this.transactionActive = false;
      this.releaseLock?.();
      this.releaseLock = null;
    }
  }

  release() {
    if (this.transactionActive) {
      this.database.exec('ROLLBACK');
      this.transactionActive = false;
    }
    this.releaseLock?.();
    this.releaseLock = null;
  }
}

export class DatabaseClient extends SqliteExecutor {
  constructor(database: DatabaseSync, private readonly mutex: AsyncMutex) {
    super(database);
  }

  async execute<T extends DatabaseRows = DatabaseRows>(sql: string, parameters: QueryParameter[] = []) {
    const release = await this.mutex.acquire();
    try {
      return this.executeSync<T>(sql, parameters);
    } finally {
      release();
    }
  }

  async getConnection() {
    return new DatabaseConnection(this.database, this.mutex);
  }
}

let client: DatabaseClient | null = null;

export function getSqlitePath() {
  const configuredPath = process.env.SQLITE_PATH?.trim();
  return configuredPath
    ? resolve(/* turbopackIgnore: true */ configuredPath)
    : join(process.cwd(), 'database', 'jeongo.sqlite');
}

export function isDatabaseConfigured() {
  return true;
}

export function getDb(): DatabaseClient {
  if (client) return client;

  const databasePath = getSqlitePath();
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath, { timeout: 5_000 });
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA synchronous = NORMAL');
  database.exec('PRAGMA busy_timeout = 5000');

  const schemaPath = join(process.cwd(), 'database', 'sqlite-schema.sql');
  if (!existsSync(schemaPath)) throw new Error('SQLITE_SCHEMA_NOT_FOUND');
  database.exec(readFileSync(schemaPath, 'utf8'));
  client = new DatabaseClient(database, new AsyncMutex());
  return client;
}
