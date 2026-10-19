import React from 'react';
import {View} from 'react-native';
import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from '../../src/design';

const items = [
  {name: 'index', title: 'Overview', icon: 'grid-outline', activeIcon: 'grid'},
  {name: 'expenses', title: 'Expenses', icon: 'wallet-outline', activeIcon: 'wallet'},
  {name: 'notes', title: 'Notes', icon: 'document-text-outline', activeIcon: 'document-text'},
  {name: 'todos', title: 'To-dos', icon: 'checkbox-outline', activeIcon: 'checkbox'},
  {name: 'habits', title: 'Habits', icon: 'repeat-outline', activeIcon: 'repeat'},
] as const;

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
            tabBarIcon: ({focused, color}) => (
              <View
                style={{
                  width: 48,
                  height: 34,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? C.primarySoft : 'transparent',
                }}
              >
                <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
