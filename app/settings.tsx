import React, {useEffect, useState} from 'react';
import {Alert, Linking, Pressable, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {categories, clearAll, settings} from '../src/db';
import {C} from '../src/design';
import {setDatePreference, setWeekPreference} from '../src/utils';
import {useRecords} from '../src/hooks';
import {Button, Card, Chip, Field, Header, Logo, Screen, Section} from '../src/ui';
import {chooseBackup, createBackup, restoreBackup} from '../src/backup';
import type {OrbitBackup} from '../src/backup-format';

export default function Settings() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [editing, setEditing] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [currency, setCurrency] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  const {data, refresh} = useRecords(async () => ({
    profileName: await settings.get('profileName'),
    currency: await settings.get('currency', 'INR'),
    dateFormat: await settings.get('dateFormat', 'system'),
    weekStart: await settings.get('weekStart', 'monday'),
    cats: await categories.all(),
  }), []);

  useEffect(() => {setProfileName(data?.profileName ?? '');}, [data?.profileName]);
  useEffect(() => {if (dateFormat) setDatePreference(dateFormat);}, [dateFormat]);
  useEffect(() => {if (weekStart) setWeekPreference(weekStart);}, [weekStart]);

  const chosenCurrency = currency || data?.currency || 'INR';
  const chosenDate = dateFormat || data?.dateFormat || 'system';
  const chosenWeek = weekStart || data?.weekStart || 'monday';

  async function saveProfile() {
    const name = profileName.trim().replace(/\s+/g, ' ');
    try {
      await settings.set('profileName', name);
      setProfileName(name);
      setProfileSaved(true);
      refresh();
    } catch (error) {
      setProfileSaved(false);
      Alert.alert('Could not save name', String(error));
    }
  }

  async function saveCategory() {
    if (!categoryName.trim()) return;
    await categories.save(categoryName.trim(), categoryType, editing || undefined);
    setCategoryName('');
    setEditing('');
    refresh();
  }

  function confirmClear() {
    Alert.alert('Clear all personal data?', 'This permanently removes your profile name, transactions, budgets, notes, tasks, habits and activity from this device.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear data', style: 'destructive', onPress: async () => {
        await clearAll();
        await settings.set('profileName', '');
        setProfileName('');
        setProfileSaved(false);
        refresh();
        Alert.alert('Data cleared', 'Your personal data was removed.');
      }},
    ]);
  }

  async function exportBackup() {
    setBackupBusy(true);
    try { await createBackup(); }
    catch (error) { Alert.alert('Could not create backup', String(error)); }
    finally { setBackupBusy(false); }
  }

  async function importBackup() {
    setBackupBusy(true);
    try {
      const backup = await chooseBackup();
      if (!backup) return;
      Alert.alert('Restore Orbit backup?', `Backup from ${new Date(backup.createdAt).toLocaleString()}. This replaces all data currently on this device, including settings, categories, transactions, notes, tasks and habits.`, [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Restore all data', style: 'destructive', onPress: () => {void applyBackup(backup);}},
      ]);
    } catch (error) { Alert.alert('Could not read backup', String(error)); }
    finally { setBackupBusy(false); }
  }

  async function applyBackup(backup: OrbitBackup) {
    setBackupBusy(true);
    try {
      await restoreBackup(backup);
      const preference = (key: string, fallback: string) => backup.tables.app_settings.find(row => row.key === key)?.value as string | undefined ?? fallback;
      setCurrency(preference('currency', 'INR'));
      setDateFormat(preference('dateFormat', 'system'));
      setWeekStart(preference('weekStart', 'monday'));
      refresh();
      Alert.alert('Backup restored', 'All Orbit data has been restored on this device.');
    } catch (error) { Alert.alert('Restore failed', `${String(error)} Your existing data was kept.`); }
    finally { setBackupBusy(false); }
  }

  return (
    <Screen>
      <Header title="Settings" subtitle="Make Orbit feel like your own." />

      <Section title="Profile" />
      <Card>
        <Text style={{color: C.muted, lineHeight: 20, marginBottom: 14}}>Your name appears in the greeting on Overview and stays on this device.</Text>
        <Field label="Your name" value={profileName} onChangeText={value => {setProfileName(value); setProfileSaved(false);}} placeholder="Your name" autoCapitalize="words" autoComplete="given-name" maxLength={40} returnKeyType="done" />
        <Button label="Save name" onPress={saveProfile} />
        {profileSaved ? <Text style={{color: C.primary, fontSize: 13, marginTop: 10}}>Saved</Text> : null}
      </Card>

      <Section title="Appearance" />
      <Card>
        <Text style={{color: C.text, fontWeight: '700'}}>Light and calm</Text>
        <Text style={{color: C.muted, marginTop: 5}}>Orbit currently uses its original light appearance.</Text>
      </Card>

      <Section title="Regional preferences" />
      <Card>
        <Text style={{color: C.text, fontWeight: '600', marginBottom: 10}}>Currency</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {['INR', 'USD', 'EUR', 'GBP'].map(value => <Chip key={value} label={value} selected={chosenCurrency === value} onPress={async () => {await settings.set('currency', value); setCurrency(value);}} />)}
        </View>
        <Text style={{color: C.muted, fontSize: 12, marginBottom: 14}}>Changing currency changes the display symbol; stored amounts are not converted.</Text>
        <Text style={{color: C.text, fontWeight: '600', marginBottom: 10}}>Date format</Text>
        <View style={{flexDirection: 'row'}}>
          {['system', 'day first', 'month first'].map(value => <Chip key={value} label={value} selected={chosenDate === value} onPress={async () => {await settings.set('dateFormat', value); setDateFormat(value);}} />)}
        </View>
        <Text style={{color: C.text, fontWeight: '600', marginTop: 8, marginBottom: 10}}>Week starts</Text>
        <View style={{flexDirection: 'row'}}>
          {['monday', 'sunday'].map(value => <Chip key={value} label={value} selected={chosenWeek === value} onPress={async () => {await settings.set('weekStart', value); setWeekStart(value);}} />)}
        </View>
      </Card>

      <Section title="Categories" />
      <Card>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          <Chip label="Expense" selected={categoryType === 'expense'} onPress={() => setCategoryType('expense')} />
          <Chip label="Income" selected={categoryType === 'income'} onPress={() => setCategoryType('income')} />
        </View>
        {data?.cats.filter(category => category.type === categoryType).map(category => (
          <View key={category.id} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderColor: C.subtle}}>
            <Text style={{flex: 1, color: C.text}}>{category.name}</Text>
            <Text onPress={() => {setEditing(category.id); setCategoryName(category.name);}} style={{color: C.primary, padding: 8}}>Edit</Text>
            <Text onPress={() => Alert.alert('Delete category?', `Transactions in ${category.name} will become uncategorized.`, [{text: 'Cancel', style: 'cancel'}, {text: 'Delete', style: 'destructive', onPress: async () => {await categories.remove(category.id); refresh();}}])} style={{color: C.danger, padding: 8}}>Delete</Text>
          </View>
        ))}
        <View style={{height: 12}} />
        <Field label={editing ? 'Rename category' : 'New category'} value={categoryName} onChangeText={setCategoryName} placeholder="Category name" />
        <Button label={editing ? 'Save category' : 'Add category'} onPress={saveCategory} />
      </Card>

      <Section title="Backup and restore" />
      <Card>
        <Text style={{color: C.muted, lineHeight: 20, marginBottom: 16}}>Save all your Orbit data, including settings, categories, transactions, budgets, notes, tasks, habits and activity, to a file you can keep. The backup contains your personal data.</Text>
        <Button label="Export full backup" onPress={exportBackup} disabled={backupBusy} />
        <View style={{height: 10}} />
        <Button label="Restore from backup" secondary onPress={importBackup} disabled={backupBusy} />
        <Text style={{color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 12}}>Restoring replaces all data currently saved on this device.</Text>
      </Card>

      <Section title="Data and privacy" />
      <Card>
        <Text style={{color: C.text, fontWeight: '700'}}>Stored on this device</Text>
        <Text style={{color: C.muted, lineHeight: 20, marginTop: 6, marginBottom: 16}}>Orbit works offline. Your personal records are held in its local SQLite database. There is no account or cloud sync.</Text>
        <Button label="Clear all personal data" danger onPress={confirmClear} />
      </Card>

      <Section title="About" />
      <Card style={{alignItems: 'center', paddingVertical: 28}}>
        <Logo size={70} />
        <Text style={{fontSize: 24, fontWeight: '700', color: C.text, marginTop: 12}}>Orbit</Text>
        <Text style={{color: C.muted, textAlign: 'center', marginTop: 6}}>A personal workspace for everything that matters.</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Visit Orbit's official website" onPress={() => {void Linking.openURL('https://orbit.v9mirza.com/').catch(error => Alert.alert('Could not open website', String(error)));}} style={{padding: 10, marginTop: 10}}>
          <Text style={{color: C.primary, fontWeight: '600', textDecorationLine: 'underline'}}>orbit.v9mirza.com</Text>
        </Pressable>
        <Text style={{color: C.muted, fontSize: 12, marginTop: 16}}>Version 1.0.0</Text>
      </Card>
      <View style={{height: 20}} />
      <Button label="Back to Overview" secondary onPress={() => router.back()} />
    </Screen>
  );
}
