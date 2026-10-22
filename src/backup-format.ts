export const BACKUP_FORMAT_VERSION = 1;
export const DATABASE_SCHEMA_VERSION = 1;

// Keep this list in sync with the tables created by migrate() in db.ts.
export const TABLE_COLUMNS = {
  app_settings: ['key', 'value', 'updated_at'],
  expense_categories: ['id', 'name', 'type', 'color_token', 'icon_name', 'is_default', 'created_at', 'updated_at'],
  transactions: ['id', 'description', 'amount_minor', 'type', 'category_id', 'transaction_date', 'note', 'created_at', 'updated_at'],
  budgets: ['id', 'name', 'amount_minor', 'period', 'start_date', 'category_id', 'created_at', 'updated_at'],
  notes: ['id', 'title', 'content', 'color_token', 'is_pinned', 'created_at', 'updated_at'],
  tags: ['id', 'name', 'created_at'],
  note_tags: ['note_id', 'tag_id'],
  tasks: ['id', 'title', 'description', 'is_completed', 'priority', 'due_at', 'recurrence_rule', 'recurrence_timezone', 'completed_at', 'created_at', 'updated_at', 'parent_task_id'],
  habits: ['id', 'name', 'description', 'icon_name', 'color_token', 'target_value', 'target_unit', 'schedule_rule', 'start_date', 'is_active', 'created_at', 'updated_at'],
  habit_checkins: ['id', 'habit_id', 'local_date', 'completed', 'value', 'created_at', 'updated_at'],
  activity_events: ['id', 'entity_type', 'entity_id', 'event_type', 'occurred_at', 'metadata_json'],
} as const;

export type TableName = keyof typeof TABLE_COLUMNS;
export type BackupValue = string | number | null;
export type BackupRow = Record<string, BackupValue>;
export type OrbitBackup = {
  app: 'orbit';
  formatVersion: number;
  schemaVersion: number;
  createdAt: string;
  tables: Record<TableName, BackupRow[]>;
};

export const TABLE_NAMES = Object.keys(TABLE_COLUMNS) as TableName[];

type BackupTransaction = {
  execAsync(sql: string): Promise<unknown>;
  runAsync(sql: string, values: BackupValue[]): Promise<unknown>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
};

export async function replaceBackupTables(txn: BackupTransaction, backup: OrbitBackup): Promise<void> {
  await txn.execAsync('PRAGMA defer_foreign_keys = ON');
  for (const table of [...TABLE_NAMES].reverse()) await txn.execAsync(`DELETE FROM ${table}`);
  for (const table of TABLE_NAMES) {
    const columns: readonly string[] = TABLE_COLUMNS[table];
    const placeholders = columns.map(() => '?').join(',');
    const statement = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
    for (const row of backup.tables[table]) await txn.runAsync(statement, columns.map(column => row[column]));
  }
  const foreignKeyError = await txn.getFirstAsync('PRAGMA foreign_key_check');
  if (foreignKeyError) throw new Error('The backup contains broken data links.');
  const integrity = await txn.getFirstAsync<{quick_check: string}>('PRAGMA quick_check');
  if (integrity?.quick_check !== 'ok') throw new Error('The backup failed database validation.');
}

export function parseBackup(contents: string): OrbitBackup {
  let value: unknown;
  try { value = JSON.parse(contents); } catch { throw new Error('This is not a valid JSON backup.'); }
  if (!isObject(value) || value.app !== 'orbit' || value.formatVersion !== BACKUP_FORMAT_VERSION || value.schemaVersion !== DATABASE_SCHEMA_VERSION || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) {
    throw new Error('This file is not a compatible Orbit backup.');
  }
  if (!isObject(value.tables) || Object.keys(value.tables).length !== TABLE_NAMES.length) {
    throw new Error('The backup is missing data tables.');
  }
  for (const table of TABLE_NAMES) {
    const rows = value.tables[table];
    const columns: readonly string[] = TABLE_COLUMNS[table];
    if (!Array.isArray(rows)) throw new Error(`The ${table} table is missing.`);
    for (const row of rows) {
      if (!isObject(row) || Object.keys(row).length !== columns.length || columns.some(column => !(column in row))) {
        throw new Error(`The ${table} table has an invalid row.`);
      }
      if (columns.some(column => row[column] !== null && typeof row[column] !== 'string' && !(typeof row[column] === 'number' && Number.isFinite(row[column])))) {
        throw new Error(`The ${table} table has an invalid value.`);
      }
    }
  }
  return value as OrbitBackup;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
