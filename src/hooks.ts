import {useCallback,useState} from 'react';
import {useFocusEffect} from 'expo-router';
export function useRecords<T>(loader:()=>Promise<T>,deps:unknown[]=[]){const [data,setData]=useState<T|null>(null),[error,setError]=useState('');const refresh=useCallback(()=>{loader().then(setData).catch(e=>setError(String(e)));},deps);useFocusEffect(refresh);return {data,error,refresh};}
