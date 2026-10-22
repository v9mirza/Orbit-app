import * as DocumentPicker from 'expo-document-picker';
import {File} from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {Platform} from 'react-native';
import {database} from './db';
import {BACKUP_FORMAT_VERSION, DATABASE_SCHEMA_VERSION, TABLE_NAMES, parseBackup, replaceBackupTables, type BackupRow, type OrbitBackup} from './backup-format';

export async function createBackup(): Promise<string> {
  const db = await database();
  const version = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
  if (version?.user_version !== DATABASE_SCHEMA_VERSION) throw new Error('This database version cannot be backed up yet.');

  const tables = {} as OrbitBackup['tables'];
  await db.withExclusiveTransactionAsync(async txn => {
    for (const table of TABLE_NAMES) tables[table] = await txn.getAllAsync<BackupRow>(`SELECT * FROM ${table}`);
  });
  const backup: OrbitBackup = {app: 'orbit', formatVersion: BACKUP_FORMAT_VERSION, schemaVersion: DATABASE_SCHEMA_VERSION, createdAt: new Date().toISOString(), tables};
  if (!FileSystem.cacheDirectory) throw new Error('Temporary storage is unavailable.');
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  const filename = `orbit-backup-${backup.createdAt.replace(/[:.]/g, '-')}.json`;
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup));
  await Sharing.shareAsync(uri, {mimeType: 'application/json', dialogTitle: 'Save Orbit backup'});
  return filename;
}

export async function chooseBackup(): Promise<OrbitBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({type: 'application/json', copyToCacheDirectory: Platform.OS !== 'android'});
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error('No backup file was selected.');
  if (asset.size && asset.size > 100 * 1024 * 1024) throw new Error('The backup file is too large.');
  return parseBackup(await new File(asset.uri).text());
}

export async function restoreBackup(backup: OrbitBackup): Promise<void> {
  const db = await database();
  const version = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
  if (version?.user_version !== backup.schemaVersion) throw new Error('This backup needs a different Orbit database version.');

  await db.withExclusiveTransactionAsync(async txn => replaceBackupTables(txn, backup));
}
