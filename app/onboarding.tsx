import React from 'react';
import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {settings} from '../src/db';
import {C} from '../src/design';
import {Button,Logo,Screen} from '../src/ui';
export default function Onboarding(){const router=useRouter();return <Screen><View style={{minHeight:600,justifyContent:'center',alignItems:'center'}}><Logo size={92}/><Text style={{fontSize:34,color:C.text,fontWeight:'700',marginTop:20}}>Orbit</Text><Text style={{color:C.muted,fontSize:15,textAlign:'center',marginTop:8}}>A personal workspace for everything that matters.</Text><Text style={{fontSize:24,fontWeight:'700',color:C.text,textAlign:'center',marginTop:54}}>Everything that matters, in one place.</Text><Text style={{color:C.muted,lineHeight:23,fontSize:15,textAlign:'center',marginTop:16,marginBottom:36}}>Keep track of your spending, capture your thoughts, organize tasks and build habits—all in your own personal workspace.</Text><View style={{width:'100%'}}><Button label="Get started" onPress={async()=>{await settings.set('onboarded','yes');router.replace('/');}}/></View></View></Screen>}
