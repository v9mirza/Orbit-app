import React,{useEffect,useState} from 'react';
import {Stack,useRouter} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {View,Text} from 'react-native';
import {database,settings} from '../src/db';
import {Loading} from '../src/ui';
import {C} from '../src/design';
import {setDatePreference,setWeekPreference} from '../src/utils';
import {TourProvider} from '../src/tour';
export default function Root(){
 const [ready,setReady]=useState(false),[onboarded,setOnboarded]=useState(false),[error,setError]=useState('');const router=useRouter();
 useEffect(()=>{database().then(async()=>{const [done,dateFormat,weekStart]=await Promise.all([settings.get('onboarded'),settings.get('dateFormat','system'),settings.get('weekStart','monday')]);setDatePreference(dateFormat);setWeekPreference(weekStart);setOnboarded(done==='yes');setReady(true);}).catch(e=>setError(String(e)));},[]);
 useEffect(()=>{if(ready&&!onboarded)router.replace('/onboarding');},[ready,onboarded]);
 if(error)return <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:C.background}}><Text style={{color:C.danger}}>Could not open local data: {error}</Text></View>;
 if(!ready)return <Loading/>;
 return <SafeAreaProvider><TourProvider autoStart={onboarded}><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.background},animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="onboarding" options={{animation:'fade'}}/><Stack.Screen name="transaction/[id]" options={{presentation:'modal',animation:'slide_from_bottom'}}/><Stack.Screen name="note/[id]" options={{presentation:'modal',animation:'slide_from_bottom'}}/><Stack.Screen name="task/[id]" options={{presentation:'modal',animation:'slide_from_bottom'}}/><Stack.Screen name="habit/[id]" options={{presentation:'modal',animation:'slide_from_bottom'}}/><Stack.Screen name="settings"/></Stack></TourProvider></SafeAreaProvider>
}
