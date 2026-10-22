import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Alert, Modal, Pressable, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {C} from './design';
import {settings} from './db';

const steps = [
  {title: 'Overview', icon: 'grid-outline', path: '/', body: 'See today’s tasks, habits, and spending in one place.'},
  {title: 'Expenses', icon: 'wallet-outline', path: '/expenses', body: 'Record income and expenses, then set a monthly budget.'},
  {title: 'Notes', icon: 'document-text-outline', path: '/notes', body: 'Capture ideas, search them, and pin the important ones.'},
  {title: 'To-dos', icon: 'checkbox-outline', path: '/todos', body: 'Plan tasks with due dates, priorities, and repeat schedules.'},
  {title: 'Habits', icon: 'repeat-outline', path: '/habits', body: 'Check in each day and watch your streaks grow.'},
] as const;

type TourContextValue = {startTour: () => void};
const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const value = useContext(TourContext);
  if (!value) throw new Error('TourProvider is missing.');
  return value;
}

export function TourProvider({children, autoStart}: {children: React.ReactNode; autoStart: boolean}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const checkedOnLaunch = useRef(false);

  const startTour = useCallback(() => {
    checkedOnLaunch.current = true;
    setStepIndex(0);
    router.replace('/');
    setVisible(true);
  }, [router]);

  useEffect(() => {
    if (!autoStart || checkedOnLaunch.current) return;
    let active = true;
    settings.get('tourNeverShow').then(value => {
      if (!active) return;
      checkedOnLaunch.current = true;
      if (value !== 'yes') startTour();
    }).catch(() => {if (active) checkedOnLaunch.current = true;});
    return () => {active = false;};
  }, [autoStart, startTour]);

  function next() {
    if (stepIndex === steps.length - 1) {
      setVisible(false);
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    router.replace(steps[nextIndex].path);
  }

  async function neverShowAgain() {
    try {
      await settings.set('tourNeverShow', 'yes');
      setVisible(false);
    } catch (error) {
      Alert.alert('Could not save preference', String(error));
    }
  }

  const step = steps[stepIndex];
  return (
    <TourContext.Provider value={{startTour}}>
      {children}
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setVisible(false)}>
        <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 35, 25, 0.57)', paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12) + 92}}>
          <View style={{backgroundColor: C.surface, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: C.border}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View style={{width: 46, height: 46, borderRadius: 14, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name={step.icon} size={24} color={C.primary} />
              </View>
              <Text style={{color: C.muted, fontSize: 13, fontWeight: '600'}}>{stepIndex + 1} of {steps.length}</Text>
            </View>
            <Text style={{color: C.text, fontSize: 24, fontWeight: '700', marginTop: 18}}>{step.title}</Text>
            <Text style={{color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 8}}>{step.body}</Text>
            <Pressable accessibilityRole="button" onPress={next} style={{minHeight: 48, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginTop: 22}}>
              <Text style={{color: C.surface, fontWeight: '700', fontSize: 15}}>{stepIndex === steps.length - 1 ? 'Done' : 'Next'}</Text>
            </Pressable>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
              <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={{minHeight: 44, justifyContent: 'center', paddingHorizontal: 4}}>
                <Text style={{color: C.muted, fontWeight: '600'}}>Skip for now</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => {void neverShowAgain();}} style={{minHeight: 44, justifyContent: 'center', paddingHorizontal: 4}}>
                <Text style={{color: C.primary, fontWeight: '700'}}>Don’t show again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </TourContext.Provider>
  );
}
