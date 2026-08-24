import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Logo size={120} />
        <Text style={styles.brand}>CHESSMASTER</Text>
        <Text style={styles.tagline}>Your way to become a King</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.blurb}>
          Learn chess online and offline. Live Olympiad games, a full self-learn
          curriculum, and a coach that analyzes your own games.
        </Text>
        <Button label="Join" onPress={() => navigation.navigate('SignUp')} />
        <View style={{ height: spacing.sm }} />
        <Button label="Log In" variant="outline" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between', padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brand: { ...typography.display, marginTop: spacing.md, letterSpacing: 2 },
  tagline: { ...typography.muted, color: colors.gold, fontWeight: '700', letterSpacing: 1 },
  actions: { gap: spacing.xs },
  blurb: { ...typography.muted, textAlign: 'center', marginBottom: spacing.md },
});
