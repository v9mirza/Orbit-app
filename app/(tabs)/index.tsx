import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {activity, budgets, habits, notes, tasks, transactions, settings} from '../../src/db';
import {C} from '../../src/design';
import {useDayChange, useRecords} from '../../src/hooks';
import {displayDate, dueToday, habitScheduled, localDate, monthKey, money} from '../../src/utils';
import {Button, Card, CheckButton, Empty, IconButton, Logo, Screen, Section} from '../../src/ui';
import {SpendingChart} from '../../src/chart';

function SectionAction({label, onPress}:{label:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionAction}>
    <Text style={styles.sectionActionText}>{label}</Text>
    <Ionicons name="arrow-forward" size={15} color={C.primary}/>
  </Pressable>;
}

function QuickStat({icon, value, label, tint, onPress}:{icon:keyof typeof Ionicons.glyphMap;value:string;label:string;tint:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={styles.quickStat}>
    <View style={[styles.quickIcon, {backgroundColor:tint}]}><Ionicons name={icon} size={19} color={C.primary}/></View>
    <View style={{flex:1}}><Text style={styles.quickValue} numberOfLines={1}>{value}</Text><Text style={styles.quickLabel}>{label}</Text></View>
  </Pressable>;
}

export default function Overview() {
  const router = useRouter();
  const {data, refresh} = useRecords(async () => {
    const [allTasks, allNotes, allHabits, monthTransactions, budget, events, currency, profileName] = await Promise.all([
      tasks.all(), notes.all(), habits.all(), transactions.month(monthKey()), budgets.overall(),
      activity.recent(), settings.get('currency', 'INR'), settings.get('profileName'),
    ]);
    return {allTasks, allNotes, allHabits, monthTransactions, budget, events, currency, profileName};
  }, []);
  useDayChange(refresh);

  const todayTasks = (data?.allTasks ?? []).filter(t => !t.is_completed && dueToday(t.due_at));
  const todayHabits = (data?.allHabits ?? []).filter(h => h.is_active && habitScheduled(h.schedule_rule, localDate()));
  const habitsDone = todayHabits.filter(h => h.checked).length;
  const tasksDoneToday = (data?.allTasks ?? []).filter(t => t.is_completed && t.completed_at && localDate(new Date(t.completed_at)) === localDate()).length;
  const completedToday = tasksDoneToday + habitsDone;
  const spent = (data?.monthTransactions ?? []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount_minor, 0);
  const budgetAmount = data?.budget?.amount_minor;
  const budgetProgress = budgetAmount ? Math.min(1, spent / budgetAmount) : 0;
  const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daily = Array.from({length:monthDays}, (_, i) => (data?.monthTransactions ?? [])
    .filter(t => t.type === 'expense' && Number(t.transaction_date.slice(8)) === i + 1)
    .reduce((sum, t) => sum + t.amount_minor, 0));
  const profileName = data?.profileName?.trim();

  return <Screen>
    <View style={styles.topBar}>
      <View style={styles.brand}><Logo size={36}/><Text style={styles.brandText}>Orbit</Text></View>
      <IconButton name="settings-outline" label="Settings" onPress={() => router.push('/settings')}/>
    </View>

    <LinearGradient colors={['#38684D', '#244D3A']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
      <View style={styles.heroOrb}/>
      <View style={styles.datePill}><Ionicons name="calendar-outline" size={14} color="#DDECE0"/><Text style={styles.dateText}>{displayDate(new Date())}</Text></View>
      <Text style={styles.greeting} numberOfLines={2} adjustsFontSizeToFit>Hello{profileName ? `, ${profileName}` : ''}.</Text>
      <Text style={styles.heroSubtitle}>{todayTasks.length ? `${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} to focus on today` : 'You have a clear day ahead'}</Text>
      <View style={styles.heroDivider}/>
      <View style={styles.heroFooter}>
        <View style={styles.heroFooterIcon}><Ionicons name="sparkles-outline" size={17} color="#E8F4E8"/></View>
        <Text style={styles.heroFooterText}>{completedToday ? `${completedToday} ${completedToday === 1 ? 'thing' : 'things'} completed today. Keep it going!` : 'One small step at a time. You’ve got this.'}</Text>
      </View>
    </LinearGradient>

    <View style={styles.quickRow}>
      <QuickStat icon="checkbox-outline" value={String(todayTasks.length)} label="Tasks due" tint={C.primarySoft} onPress={() => router.push('/todos')}/>
      <QuickStat icon="repeat-outline" value={`${habitsDone}/${todayHabits.length}`} label="Habits done" tint={C.blue} onPress={() => router.push('/habits')}/>
    </View>

    <View style={styles.budgetCard}>
      <View style={styles.budgetTop}><Text style={styles.eyebrow}>THIS MONTH</Text><Ionicons name="wallet-outline" size={20} color={C.primary}/></View>
      <View style={styles.moneyRow}>
        <View style={{flex:1}}><Text style={styles.moneyLabel}>Spent</Text><Text style={styles.moneyValue} numberOfLines={1} adjustsFontSizeToFit>{money(spent, data?.currency)}</Text></View>
        <View style={styles.moneyDivider}/>
        <View style={{flex:1}}><Text style={styles.moneyLabel}>{budgetAmount ? 'Budget left' : 'Budget'}</Text><Text style={styles.moneyValue} numberOfLines={1} adjustsFontSizeToFit>{budgetAmount ? money(budgetAmount - spent, data?.currency) : 'Not set'}</Text></View>
      </View>
      {budgetAmount ? <View style={styles.track}><View style={[styles.trackFill, {width:`${budgetProgress * 100}%`, backgroundColor:spent > budgetAmount ? C.danger : C.primary}]}/></View> : null}
      <Pressable accessibilityRole="button" onPress={() => router.push('/expenses')} style={styles.budgetLink}><Text style={styles.budgetLinkText}>View spending</Text><Ionicons name="arrow-forward" size={15} color={C.primary}/></Pressable>
    </View>

    <Section title="Today's tasks" action={<SectionAction label="View all" onPress={() => router.push('/todos')}/>}/>
    {todayTasks.length ? <Card style={styles.listCard}>{todayTasks.slice(0, 4).map((task, index) =>
      <View key={task.id} style={[styles.listRow, index > 0 && styles.listDivider]}>
        <CheckButton checked={false} label={`Complete ${task.title}`} onPress={async () => {await tasks.toggle(task); refresh();}} size={25}/>
        <Pressable onPress={() => router.push(`/task/${task.id}`)} style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{task.title}</Text>
          <Text style={styles.rowMeta}>{task.due_at ? displayDate(task.due_at) : 'Today'}</Text>
        </Pressable>
        <View style={[styles.priorityDot, {backgroundColor:task.priority === 'high' ? C.peachText : task.priority === 'low' ? C.blueText : C.primary}]}/>
      </View>)}
    </Card> : <Empty icon="checkbox-outline" title="A clear day ahead." body="No tasks due today." action={<Button label="Add task" onPress={() => router.push('/task/new')}/>}/>}

    <Section title="Habits for today" action={<SectionAction label="View all" onPress={() => router.push('/habits')}/>}/>
    {todayHabits.length ? <Card style={styles.listCard}>{todayHabits.map((habit, index) =>
      <Pressable key={habit.id} accessibilityRole="checkbox" accessibilityState={{checked:!!habit.checked}} onPress={async () => {await habits.check(habit.id); refresh();}} style={[styles.listRow, index > 0 && styles.listDivider]}>
        <View style={[styles.habitIcon, !!habit.checked && styles.habitIconDone]}><Ionicons name={habit.checked ? 'checkmark' : 'repeat'} size={19} color={C.primary}/></View>
        <Text style={[styles.rowTitle, {flex:1}]} numberOfLines={1}>{habit.name}</Text>
        <Text style={styles.habitStatus}>{habit.checked ? 'Done' : 'Check in'}</Text>
      </Pressable>)}</Card> : <Empty icon="repeat-outline" title="Build your first habit." action={<Button label="Add habit" onPress={() => router.push('/habit/new')}/>}/>}

    <Section title="Spending this month" action={<SectionAction label="Details" onPress={() => router.push('/expenses')}/>}/>
    <Card><SpendingChart values={daily} currency={data?.currency}/></Card>

    <Section title="Recent notes" action={<SectionAction label="View all" onPress={() => router.push('/notes')}/>}/>
    {data?.allNotes.length ? data.allNotes.slice(0, 3).map(note => <Pressable key={note.id} onPress={() => router.push(`/note/${note.id}`)}><Card style={{marginBottom:8,backgroundColor:note.color_token || C.lavender}}><Text style={styles.rowTitle}>{note.is_pinned ? '⌁ ' : ''}{note.title}</Text><Text numberOfLines={2} style={{color:C.muted,marginTop:6}}>{note.content}</Text></Card></Pressable>) : <Empty icon="document-text-outline" title="Your personal space starts here." action={<Button label="Write a note" onPress={() => router.push('/note/new')}/>}/>}

    <Section title="Recent activity"/>
    {data?.events.length ? <Card>{data.events.map((event, index) => <View key={event.id} style={[{paddingVertical:8}, index > 0 && {borderTopWidth:1,borderColor:C.subtle}]}><Text style={{color:C.text}}>{event.event_type}</Text><Text style={{color:C.muted,fontSize:11,marginTop:3}}>{new Date(event.occurred_at).toLocaleString()}</Text></View>)}</Card> : <Text style={{color:C.muted,marginBottom:20}}>Your activity will appear here as you use Orbit.</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  topBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:20},
  brand:{flexDirection:'row',alignItems:'center',gap:10},
  brandText:{fontSize:20,fontWeight:'800',letterSpacing:-.5,color:C.text},
  hero:{borderRadius:25,padding:22,overflow:'hidden',minHeight:205},
  heroOrb:{position:'absolute',width:190,height:190,borderRadius:95,right:-72,top:-78,backgroundColor:'rgba(255,255,255,0.055)'},
  datePill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(255,255,255,0.12)',paddingHorizontal:11,paddingVertical:7,borderRadius:20},
  dateText:{fontSize:12,fontWeight:'600',color:'#E6F1E7'},
  greeting:{fontSize:31,fontWeight:'800',letterSpacing:-.8,color:'#FFFFFF',marginTop:19},
  heroSubtitle:{fontSize:15,color:'#DCEADD',marginTop:3},
  heroDivider:{height:1,backgroundColor:'rgba(255,255,255,0.17)',marginTop:21,marginBottom:14},
  heroFooter:{flexDirection:'row',alignItems:'center',gap:9},
  heroFooterIcon:{width:28,height:28,borderRadius:9,backgroundColor:'rgba(255,255,255,0.12)',alignItems:'center',justifyContent:'center'},
  heroFooterText:{flex:1,color:'#E8F4E8',fontSize:13,fontWeight:'600'},
  quickRow:{flexDirection:'row',gap:10,marginTop:12},
  quickStat:{flex:1,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:C.surface,borderRadius:18,borderWidth:1,borderColor:C.border,paddingHorizontal:13,paddingVertical:16},
  quickIcon:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'},
  quickValue:{fontSize:20,fontWeight:'800',color:C.text,letterSpacing:-.4},
  quickLabel:{fontSize:11,color:C.muted,marginTop:2},
  budgetCard:{backgroundColor:'#F0F5EE',borderRadius:20,padding:18,marginTop:12},
  budgetTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.2,color:C.primary},
  moneyRow:{flexDirection:'row',alignItems:'center',marginTop:13},
  moneyLabel:{fontSize:12,color:C.muted,marginBottom:3},
  moneyValue:{fontSize:21,fontWeight:'800',letterSpacing:-.6,color:C.text},
  moneyDivider:{width:1,height:42,backgroundColor:'#D6E3D6',marginHorizontal:16},
  track:{height:6,borderRadius:4,backgroundColor:'#D6E3D6',overflow:'hidden',marginTop:16},
  trackFill:{height:'100%',borderRadius:4},
  budgetLink:{flexDirection:'row',alignItems:'center',gap:5,alignSelf:'flex-end',marginTop:14},
  budgetLinkText:{fontSize:12,fontWeight:'700',color:C.primary},
  sectionAction:{flexDirection:'row',alignItems:'center',gap:4,minHeight:36,paddingLeft:10},
  sectionActionText:{fontSize:13,fontWeight:'700',color:C.primary},
  listCard:{paddingVertical:2,paddingHorizontal:15},
  listRow:{minHeight:68,flexDirection:'row',alignItems:'center'},
  listDivider:{borderTopWidth:1,borderColor:C.subtle},
  rowBody:{flex:1,paddingVertical:10,marginLeft:4},
  rowTitle:{fontSize:14,fontWeight:'700',color:C.text},
  rowMeta:{fontSize:12,color:C.muted,marginTop:4},
  priorityDot:{width:8,height:8,borderRadius:4,marginHorizontal:9},
  habitIcon:{width:36,height:36,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:C.blue,marginRight:12},
  habitIconDone:{backgroundColor:C.primarySoft},
  habitStatus:{fontSize:12,fontWeight:'600',color:C.primary},
});
