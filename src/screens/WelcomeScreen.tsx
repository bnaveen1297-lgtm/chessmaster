import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen(_props: Props) {
  const { signInWithGoogle, authError } = useAuth();
  const [busy, setBusy] = useState(false);

  const onGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

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

        <Pressable
          onPress={onGoogle}
          disabled={busy}
          style={({ pressed }) => [styles.google, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]}
        >
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Icon name="logo-google" size={20} color={colors.ink} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <Text style={styles.terms}>
          By continuing you agree to ChessMaster's Privacy Policy and Terms of Use.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between', padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brand: { ...typography.display, marginTop: spacing.md, letterSpacing: 2 },
  tagline: { ...typography.muted, color: colors.gold, fontWeight: '700', letterSpacing: 1 },
  actions: { gap: spacing.sm },
  blurb: { ...typography.muted, textAlign: 'center', marginBottom: spacing.sm },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 52,
  },
  googleText: { ...typography.body, fontWeight: '700', color: colors.ink },
  error: { color: colors.danger, fontWeight: '600', textAlign: 'center' },
  terms: { ...typography.muted, fontSize: 12, textAlign: 'center' },
});
