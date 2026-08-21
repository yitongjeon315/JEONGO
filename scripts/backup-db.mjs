import { existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';

const sourcePath = resolve(process.env.SQLITE_PATH?.trim() || 'database/jeongo.sqlite');
if (!existsSync(sourcePath)) throw new Error(`SQLite database does not exist: ${sourcePath}`);

const backupDirectory = resolve('database/backups');
mkdirSync(backupDirectory, { recursive: true });
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destinationPath = resolve(backupDirectory, `jeongo-${timestamp}.sqlite`);
const database = new DatabaseSync(sourcePath, { readOnly: true });
await backup(database, destinationPath);
database.close();
console.log(`SQLite backup created: ${basename(destinationPath)} (${dirname(destinationPath)})`);
