import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, View} from 'react-native';
import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from '../../src/design';

const items = [
  {name: 'index', title: 'Overview', icon: 'grid-outline', activeIcon: 'grid'},
  {name: 'expenses', title: 'Expenses', icon: 'wallet-outline', activeIcon: 'wallet'},
  {name: 'notes', title: 'Notes', icon: 'document-text-outline', activeIcon: 'document-text'},
  {name: 'todos', title: 'To-dos', icon: 'checkbox-outline', activeIcon: 'checkbox'},
  {name: 'habits', title: 'Habits', icon: 'repeat-outline', activeIcon: 'repeat'},
] as const;

function TabIcon({focused, color, icon, activeIcon}: {
  focused: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}) {
  const selected = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active) return;
      if (reduced) selected.setValue(focused ? 1 : 0);
      else Animated.timing(selected, {toValue: focused ? 1 : 0, duration: 190, useNativeDriver: true}).start();
    }).catch(() => selected.setValue(focused ? 1 : 0));
    return () => {active = false; selected.stopAnimation();};
  }, [focused, selected]);

  return (
    <View style={{width: 48, height: 34, alignItems: 'center', justifyContent: 'center'}}>
      <Animated.View style={{position: 'absolute', width: 48, height: 34, borderRadius: 12, backgroundColor: C.primarySoft, opacity: selected}} />
      <Animated.View style={{transform: [{scale: selected.interpolate({inputRange: [0, 1], outputRange: [1, 1.08]})}]}}>
        <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
      </Animated.View>
    </View>
  );
}

export default function Layout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          height: 66 + bottom,
          paddingTop: 7,
          paddingBottom: bottom,
          backgroundColor: C.surface,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 8,
        },
        tabBarIconStyle: {width: 52, height: 34},
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600', marginTop: 3},
        tabBarItemStyle: {minWidth: 56},
      }}
    >
      {items.map(({name, title, icon, activeIcon}) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({focused, color}) => <TabIcon focused={focused} color={String(color)} icon={icon} activeIcon={activeIcon} />,
          }}
          listeners={{tabPress: () => {void Haptics.selectionAsync().catch(() => {});}}}
        />
      ))}
    </Tabs>
  );
}
