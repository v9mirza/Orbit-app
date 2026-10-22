import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {localDate} from './utils';
export function useRecords<T>(loader:()=>Promise<T>,deps:unknown[]=[]){const [data,setData]=useState<T|null>(null),[error,setError]=useState('');const refresh=useCallback(()=>{loader().then(setData).catch(e=>setError(String(e)));},deps);useFocusEffect(refresh);return {data,error,refresh};}
export function useDayChange(refresh:()=>void){
 const day=useRef(localDate());
 useEffect(()=>{
  const check=()=>{const current=localDate();if(current!==day.current){day.current=current;refresh();}};
  const timer=setInterval(check,60_000);
  const subscription=AppState.addEventListener('change',state=>{if(state==='active')check();});
  return ()=>{clearInterval(timer);subscription.remove();};
 },[refresh]);
}
