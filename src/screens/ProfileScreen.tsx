import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Card, Button, SectionHeader, Pill } from '../components/ui';
import { Logo } from '../components/Logo';
import { colors, radius, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useProgress, levelFromXp } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();
  const stats = [
    { label: 'LEVEL', value: String(levelFromXp(progress.xp)) },
    { label: 'STREAK', value: `${progress.streakDays}🔥` },
    { label: 'PUZZLES', value: String(progress.puzzlesSolved) },
  ];
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Logo size={54} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>{user?.firstName || 'You'}</Text>
          <Text style={typography.muted}>{user?.email || 'ChessMaster member'}</Text>
        </View>
        <Pill label="FREE" tone="gold" />
      </View>

      <View style={styles.statRow}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={typography.label}>{s.label}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Settings" />
      <Card>
        <Pressable onPress={() => navigation.navigate('Plans')}>
          <Row label="Membership plans" value="Free now ›" />
        </Pressable>
        <Row label="Connected accounts" value="Chess.com, Lichess" />
        <Row label="Notifications" value="On" />
        <Row label="Board theme" value="Classic" />
      </Card>

      <Button label="Log out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={typography.body}>{label}</Text>
      <Text style={typography.muted}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
