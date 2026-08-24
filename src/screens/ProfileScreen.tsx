import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, SectionHeader, Pill } from '../components/ui';
import { Logo } from '../components/Logo';
import { colors, radius, spacing, typography } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const stats = [
  { label: 'RATING', value: '1180' },
  { label: 'STREAK', value: '12🔥' },
  { label: 'PUZZLES', value: '340' },
];

export function ProfileScreen({ navigation }: Props) {
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Logo size={54} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>You</Text>
          <Text style={typography.muted}>ChessMaster member · improving fast</Text>
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
        <Row label="Connected accounts" value="Chess.com, Lichess" />
        <Row label="Notifications" value="On" />
        <Row label="Board theme" value="Classic" />
        <Row label="Restore purchase" value="" />
      </Card>

      <Button label="Log out" variant="outline" onPress={() => navigation.replace('Welcome')} />
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
