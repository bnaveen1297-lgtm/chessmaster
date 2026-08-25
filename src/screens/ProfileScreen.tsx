import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, Group, Row, Pill } from '../components/ui';
import { Logo } from '../components/Logo';
import { Icon, type IconName } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useProgress, levelFromXp } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const STAT_TILES: { key: string; title: string; icon: IconName; color: string }[] = [
  { key: 'level', title: 'Level', icon: 'trending-up', color: colors.tint },
  { key: 'streak', title: 'Day streak', icon: 'flame', color: '#E08A2B' },
  { key: 'puzzles', title: 'Puzzles solved', icon: 'extension-puzzle', color: '#1F9E7A' },
  { key: 'wins', title: 'Games won', icon: 'trophy', color: '#E0568A' },
];

const SETTINGS: { key: string; title: string; value: string; icon: IconName; color: string; dest?: keyof RootStackParamList }[] = [
  { key: 'history', title: 'Your games', value: 'Replay', icon: 'time', color: colors.tint, dest: 'GamesHistory' },
  { key: 'plans', title: 'Membership plans', value: 'Free', icon: 'star', color: '#8E5BE0', dest: 'Plans' },
  { key: 'accounts', title: 'Connected accounts', value: 'Chess.com, Lichess', icon: 'link', color: '#1F9E7A' },
  { key: 'notifications', title: 'Notifications', value: 'On', icon: 'notifications', color: '#E0568A' },
  { key: 'theme', title: 'Board theme', value: 'Classic', icon: 'color-palette', color: '#E08A2B' },
];

function Tile({ icon, color }: { icon: IconName; color: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: color }]}>
      <Icon name={icon} size={18} color="#fff" />
    </View>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { progress } = useProgress();

  const statValues: Record<string, string> = {
    level: String(levelFromXp(progress.xp)),
    streak: String(progress.streakDays),
    puzzles: String(progress.puzzlesSolved),
    wins: String(progress.gamesWon),
  };

  return (
    <Screen>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
      </View>
      <Text style={styles.largeTitle}>Profile</Text>

      {/* Identity card */}
      <Card style={styles.identity}>
        <View style={styles.avatar}>
          <Logo size={54} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>{user?.firstName || 'You'}</Text>
          <Text style={typography.muted}>{user?.email || 'ChessMaster member'}</Text>
        </View>
        <Pill label="FREE" tone="default" />
      </Card>

      {/* Stats */}
      <Text style={styles.sectionLabel}>STATS</Text>
      <Group>
        {STAT_TILES.map((s, i) => (
          <Row
            key={s.key}
            title={s.title}
            left={<Tile icon={s.icon} color={s.color} />}
            right={<Text style={styles.statValue}>{statValues[s.key]}</Text>}
            first={i === 0}
            last={i === STAT_TILES.length - 1}
          />
        ))}
      </Group>

      {/* Settings */}
      <Text style={styles.sectionLabel}>SETTINGS</Text>
      <Group>
        {SETTINGS.map((s, i) => (
          <Row
            key={s.key}
            title={s.title}
            left={<Tile icon={s.icon} color={s.color} />}
            right={
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{s.value}</Text>
                <Icon name="chevron-forward" size={18} color={colors.textFaint} />
              </View>
            }
            onPress={s.dest ? () => navigation.navigate(s.dest as never) : undefined}
            first={i === 0}
            last={i === SETTINGS.length - 1}
          />
        ))}
      </Group>

      <Button label="Log out" variant="outline" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', height: 30 },
  back: { fontSize: 30, width: 40, color: colors.ink },
  largeTitle: { ...typography.display, marginBottom: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  tile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowValue: { ...typography.muted },
});
