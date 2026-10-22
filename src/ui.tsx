import React, {useCallback, useEffect, useRef} from 'react';
import {AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from './design';

export function Logo({size=38}:{size?:number}){return <Image source={require('../assets/logo.png')} accessibilityLabel="Orbit logo" style={{width:size,height:size,borderRadius:size*.23}}/>}
function usePressScale(){const scale=useRef(new Animated.Value(1)).current;const reduced=useRef(false);useEffect(()=>{AccessibilityInfo.isReduceMotionEnabled().then(value=>{reduced.current=value;}).catch(()=>{});},[]);const pressIn=()=>{if(!reduced.current)Animated.spring(scale,{toValue:.97,useNativeDriver:true,speed:30,bounciness:0}).start();};const pressOut=()=>{if(!reduced.current)Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:24,bounciness:5}).start();};return {scale,pressIn,pressOut};}
export function Screen({children,scroll=true}:{children:React.ReactNode;scroll?:boolean}){
 const insets=useSafeAreaInsets();
 const progress=useRef(new Animated.Value(0)).current;
 const style={flex:1,backgroundColor:C.background};
 useFocusEffect(useCallback(()=>{
  let active=true;
  AccessibilityInfo.isReduceMotionEnabled().then(reduced=>{
   if(!active)return;
   if(reduced){progress.setValue(1);return;}
   progress.setValue(0);
   Animated.timing(progress,{toValue:1,duration:260,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  }).catch(()=>progress.setValue(1));
  return ()=>{active=false;progress.stopAnimation();};
 },[progress]));
 const motion={opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[12,0]})}]};
 return <KeyboardAvoidingView style={style} behavior={Platform.OS==='ios'?'padding':undefined}>{scroll?<Animated.ScrollView style={[style,motion]} contentContainerStyle={{paddingHorizontal:20,paddingTop:Math.max(insets.top,16)+8,paddingBottom:32}} keyboardShouldPersistTaps="handled">{children}</Animated.ScrollView>:<Animated.View style={[style,motion,{paddingHorizontal:20,paddingTop:Math.max(insets.top,16)+8}]}>{children}</Animated.View>}</KeyboardAvoidingView>;
}
export function Header({title,subtitle,action}:{title:string;subtitle?:string;action?:React.ReactNode}){return <View style={{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}><View style={{flex:1,paddingRight:8}}><Text style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}</View>{action}</View>}
export function Section({title,action}:{title:string;action?:React.ReactNode}){return <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:24,marginBottom:12}}><Text style={s.section}>{title}</Text>{action}</View>}
export function Card({children,style}:{children:React.ReactNode;style?:object}){return <View style={[s.card,style]}>{children}</View>}
export function Button({label,onPress,icon,secondary=false,danger=false,disabled=false}:{label:string;onPress:()=>void;icon?:keyof typeof Ionicons.glyphMap;secondary?:boolean;danger?:boolean;disabled?:boolean}){const {scale,pressIn,pressOut}=usePressScale();return <Animated.View style={{transform:[{scale}]}}><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={({pressed})=>[s.button,{backgroundColor:danger?C.dangerSoft:secondary?C.surface:pressed?C.primaryPressed:C.primary,borderWidth:secondary?1:0,borderColor:C.border,opacity:disabled?.55:1}]}>{icon?<Ionicons name={icon} size={18} color={danger?C.danger:secondary?C.primary:C.surface}/>:null}<Text style={{fontSize:14,fontWeight:'700',color:danger?C.danger:secondary?C.primary:C.surface}}>{label}</Text></Pressable></Animated.View>}
export function IconButton({name,onPress,label}:{name:keyof typeof Ionicons.glyphMap;onPress:()=>void;label:string}){const {scale,pressIn,pressOut}=usePressScale();return <Animated.View style={{transform:[{scale}]}}><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={s.iconButton}><Ionicons name={name} size={21} color={C.primary}/></Pressable></Animated.View>}
export function CheckButton({checked,label,onPress,size=26}:{checked:boolean;label:string;onPress:()=>void;size?:number}){
 const bounce=useRef(new Animated.Value(1)).current;
 const previous=useRef(checked);
 useEffect(()=>{
  if(previous.current===checked)return;
  previous.current=checked;
  let active=true;
  AccessibilityInfo.isReduceMotionEnabled().then(reduced=>{
   if(!active)return;
   if(reduced){bounce.setValue(1);return;}
   Animated.sequence([Animated.spring(bounce,{toValue:1.2,useNativeDriver:true,speed:28,bounciness:8}),Animated.spring(bounce,{toValue:1,useNativeDriver:true,speed:22,bounciness:5})]).start();
  }).catch(()=>bounce.setValue(1));
  return ()=>{active=false;bounce.stopAnimation();};
 },[checked,bounce]);
 return <Pressable accessibilityRole="checkbox" accessibilityState={{checked}} accessibilityLabel={label} onPress={onPress} style={{width:44,height:44,justifyContent:'center'}}><Animated.View style={{transform:[{scale:bounce}]}}><Ionicons name={checked?'checkmark-circle':'ellipse-outline'} size={size} color={C.primary}/></Animated.View></Pressable>;
}
export function Field({label,...props}:TextInputProps&{label:string}){return <View style={{marginBottom:16}}><Text style={s.label}>{label}</Text><TextInput {...props} placeholderTextColor={C.muted} style={[s.input,props.multiline?{minHeight:120,textAlignVertical:'top'}:null,props.style]}/></View>}
export function Chip({label,selected,onPress}:{label:string;selected?:boolean;onPress:()=>void}){const {scale,pressIn,pressOut}=usePressScale();return <Animated.View style={{transform:[{scale}],marginRight:8,marginBottom:8}}><Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[s.chip,{backgroundColor:selected?C.primarySoft:C.surface,borderColor:selected?C.primarySoft:C.border}]}><Text style={{color:selected?C.primary:C.muted,fontWeight:selected?'700':'500',fontSize:13}}>{label}</Text></Pressable></Animated.View>}
export function Empty({icon,title,body,action}:{icon:keyof typeof Ionicons.glyphMap;title:string;body?:string;action?:React.ReactNode}){return <Card style={{alignItems:'center',paddingVertical:32}}><View style={{backgroundColor:C.primarySoft,padding:15,borderRadius:16,marginBottom:12}}><Ionicons name={icon} color={C.primary} size={26}/></View><Text style={{fontWeight:'700',fontSize:16,color:C.text,textAlign:'center'}}>{title}</Text>{body?<Text style={{color:C.muted,textAlign:'center',marginTop:6,marginBottom:16,lineHeight:20}}>{body}</Text>:null}{action}</Card>}
export function Loading(){return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.background}}><Logo size={96}/><Text style={{fontSize:25,fontWeight:'700',color:C.text,marginTop:18,marginBottom:24}}>Orbit</Text><ActivityIndicator color={C.primary}/></View>}
export function Metric({label,value,icon,tint=C.primarySoft}:{label:string;value:string;icon:keyof typeof Ionicons.glyphMap;tint?:string}){return <Card style={{flex:1,minWidth:140,marginBottom:10}}><View style={{width:34,height:34,borderRadius:10,backgroundColor:tint,alignItems:'center',justifyContent:'center',marginBottom:12}}><Ionicons name={icon} size={18} color={C.primary}/></View><Text style={{fontSize:21,fontWeight:'700',color:C.text}}>{value}</Text><Text style={{color:C.muted,fontSize:12,marginTop:4}}>{label}</Text></Card>}
export const s=StyleSheet.create({title:{fontSize:28,fontWeight:'700',color:C.text,letterSpacing:-.6},subtitle:{fontSize:14,color:C.muted,marginTop:6,lineHeight:20},section:{fontSize:18,fontWeight:'700',color:C.text},card:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:17,padding:17},button:{minHeight:46,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:16},iconButton:{width:44,height:44,borderRadius:12,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,alignItems:'center',justifyContent:'center'},input:{minHeight:48,borderWidth:1,borderColor:C.border,borderRadius:12,backgroundColor:C.surface,paddingHorizontal:14,paddingVertical:10,color:C.text,fontSize:15},label:{fontSize:13,fontWeight:'600',color:C.text,marginBottom:8},chip:{paddingHorizontal:14,minHeight:36,borderWidth:1,borderRadius:19,alignItems:'center',justifyContent:'center'}});
