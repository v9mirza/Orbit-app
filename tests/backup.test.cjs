const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {DatabaseSync} = require('node:sqlite');

let format;
async function backupFormat() { return format ??= await import('../src/backup-format.ts'); }

test('backup covers every current data table and column', async () => {
  const {TABLE_COLUMNS, TABLE_NAMES} = await backupFormat();
  const source = fs.readFileSync(path.join(__dirname, '../src/db.ts'), 'utf8');
  const schema = source.match(/await db\.execAsync\(`(CREATE TABLE IF NOT EXISTS app_settings[\s\S]*?)`\);/)[1];
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(schema);
    const actualTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual([...TABLE_NAMES].sort(), actualTables);
    for (const table of TABLE_NAMES) {
      const actualColumns = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
      assert.deepEqual([...TABLE_COLUMNS[table]], actualColumns, table);
    }
  } finally { db.close(); }
});

test('backup parser rejects incomplete and malformed data', async () => {
  const {TABLE_NAMES, BACKUP_FORMAT_VERSION, DATABASE_SCHEMA_VERSION, parseBackup} = await backupFormat();
  const make = () => ({app: 'orbit', formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: DATABASE_SCHEMA_VERSION, createdAt: '2026-10-21T10:00:00.000Z', tables: Object.fromEntries(TABLE_NAMES.map(table => [table, []]))});
  assert.deepEqual(parseBackup(JSON.stringify(make())).tables.tasks, []);
  const missing = make();
  delete missing.tables.notes;
  assert.throws(() => parseBackup(JSON.stringify(missing)), /missing data tables/);
  const invalid = make();
  invalid.tables.notes.push({id: 'note'});
  assert.throws(() => parseBackup(JSON.stringify(invalid)), /invalid row/);
  const future = make();
  future.schemaVersion++;
  assert.throws(() => parseBackup(JSON.stringify(future)), /compatible Orbit backup/);
});

test('restore replaces all tables and rolls back broken relationships', async () => {
  const {TABLE_NAMES, BACKUP_FORMAT_VERSION, DATABASE_SCHEMA_VERSION, replaceBackupTables} = await backupFormat();
  const source = fs.readFileSync(path.join(__dirname, '../src/db.ts'), 'utf8');
  const schema = source.match(/await db\.execAsync\(`(CREATE TABLE IF NOT EXISTS app_settings[\s\S]*?)`\);/)[1];
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schema);
  const now = Date.now();
  db.prepare('INSERT INTO notes VALUES(?,?,?,?,?,?,?)').run('old', 'Old note', '', null, 0, now, now);
  const base = () => ({app: 'orbit', formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: DATABASE_SCHEMA_VERSION, createdAt: new Date(now).toISOString(), tables: Object.fromEntries(TABLE_NAMES.map(table => [table, []]))});
  const transaction = {
    execAsync: async sql => db.exec(sql),
    runAsync: async (sql, values) => db.prepare(sql).run(...values),
    getFirstAsync: async sql => db.prepare(sql).get() ?? null,
  };
  async function apply(backup) {
    db.exec('BEGIN');
    try { await replaceBackupTables(transaction, backup); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  try {
    const valid = base();
    valid.tables.app_settings.push({key: 'currency', value: 'USD', updated_at: now});
    valid.tables.expense_categories.push({id: 'food', name: 'Food', type: 'expense', color_token: null, icon_name: null, is_default: 0, created_at: now, updated_at: now});
    valid.tables.transactions.push({id: 'lunch', description: 'Lunch', amount_minor: 500, type: 'expense', category_id: 'food', transaction_date: '2026-10-21', note: null, created_at: now, updated_at: now});
    valid.tables.notes.push({id: 'new', title: 'New note', content: 'Saved', color_token: null, is_pinned: 0, created_at: now, updated_at: now});
    await apply(valid);
    assert.deepEqual(db.prepare('SELECT id FROM notes').all().map(row => row.id), ['new']);
    assert.equal(db.prepare('SELECT value FROM app_settings WHERE key=?').get('currency').value, 'USD');
    assert.equal(db.prepare('SELECT category_id FROM transactions WHERE id=?').get('lunch').category_id, 'food');

    const invalid = base();
    invalid.tables.transactions.push({...valid.tables.transactions[0], category_id: 'missing'});
    await assert.rejects(apply(invalid), /broken data links/);
    assert.deepEqual(db.prepare('SELECT id FROM notes').all().map(row => row.id), ['new']);
    assert.equal(db.prepare('SELECT category_id FROM transactions WHERE id=?').get('lunch').category_id, 'food');
  } finally { db.close(); }
});
