import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {settings} from '../src/db';
import {C} from '../src/design';
import {useTour} from '../src/tour';
import {Button, Field, Logo, Screen} from '../src/ui';

export default function Onboarding() {
  const {startTour} = useTour();
  const [name, setName] = useState('');

  async function finish() {
    await settings.set('profileName', name.trim().replace(/\s+/g, ' '));
    await settings.set('onboarded', 'yes');
    startTour();
  }

  return (
    <Screen>
      <View style={{minHeight: 600, justifyContent: 'center', alignItems: 'center'}}>
        <Logo size={92} />
        <Text style={{fontSize: 34, color: C.text, fontWeight: '700', marginTop: 20}}>Orbit</Text>
        <Text style={{color: C.muted, fontSize: 15, textAlign: 'center', marginTop: 8}}>A personal workspace for everything that matters.</Text>
        <Text style={{fontSize: 24, fontWeight: '700', color: C.text, textAlign: 'center', marginTop: 48}}>Everything that matters, in one place.</Text>
        <Text style={{color: C.muted, lineHeight: 23, fontSize: 15, textAlign: 'center', marginTop: 16, marginBottom: 28}}>Keep track of your spending, capture your thoughts, organize tasks and build habits—all in your own personal workspace.</Text>
        <View style={{width: '100%'}}>
          <Field label="What should we call you? (optional)" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="given-name" maxLength={40} returnKeyType="done" />
          <Button label="Get started" onPress={finish} />
        </View>
      </View>
    </Screen>
  );
}
