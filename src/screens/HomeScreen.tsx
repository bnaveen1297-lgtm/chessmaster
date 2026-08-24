import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Card } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { useProgress, levelFromXp, xpIntoLevel, XP_PER_LEVEL, ACHIEVEMENTS } from '../game/ProgressContext';
import { useAuth } from '../auth/AuthContext';
import { liveGames } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TILES: { key: string; title: string; subtitle: string; icon: IconName; color: string }[] = [
  { key: 'play', title: 'Play', subtitle: 'Beat the engine', icon: 'play', color: '#7C3AED' },
  { key: 'learn', title: 'Learn', subtitle: 'Lessons & openings', icon: 'book', color: '#1F9E7A' },
  { key: 'analyse', title: 'Analyse', subtitle: 'Review your games', icon: 'search', color: '#E08A2B' },
  { key: 'game', title: 'Game', subtitle: 'Tournaments & friends', icon: 'trophy', color: '#E0568A' },
];

export function HomeScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const { user } = useAuth();
  const level = levelFromXp(progress.xp);
  const into = xpIntoLevel(progress.xp);
  const live = liveGames.find((g) => g.status === 'live')!;
  const goalPct = Math.min(1, progress.dailyGoal ? progress.solvedToday / progress.dailyGoal : 0);

  const onTile = (key: string) => {
    if (key === 'play') navigation.navigate('PlayVsComputer');
    else if (key === 'learn') navigation.navigate('Class');
    else if (key === 'analyse') navigation.navigate('Analyze');
    else navigation.navigate('Game');
  };

  return (
    <Screen>
      <AppHeader title={`Hi, ${user?.firstName || 'Champion'}`} onProfile={() => navigation.navigate('Profile')} />

      {/* Four primary destinations — the first thing you see */}
      <View style={styles.grid}>
        {TILES.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => onTile(t.key)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <View style={[styles.iconSquare, { backgroundColor: t.color }]}>
              <Icon name={t.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSub}>{t.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {/* Compact progress strip */}
      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.levelText}>Level {level}</Text>
          <View style={styles.streakRow}>
            <Icon name="flame" size={15} color={colors.gold} />
            <Text style={styles.streakText}>{progress.streakDays}-day streak</Text>
          </View>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${(into / XP_PER_LEVEL) * 100}%` }]} />
        </View>
        <View style={styles.progressBottom}>
          <Text style={styles.progressMeta}>{into}/{XP_PER_LEVEL} XP</Text>
          <Text style={styles.progressMeta}>Daily goal {progress.solvedToday}/{progress.dailyGoal}</Text>
        </View>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${goalPct * 100}%` }]} />
        </View>
      </Card>

      {/* Olympiad live */}
      <Card style={styles.liveCard} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
        <Text style={styles.liveTag}>● OLYMPIAD LIVE</Text>
        <Text style={styles.liveMatch}>{live.white} vs {live.black}</Text>
        <Text style={styles.liveMeta}>{live.event}</Text>
      </Card>

      {/* Stats */}
      <Text style={styles.sectionLabel}>YOUR STATS</Text>
      <View style={styles.statRow}>
        <Stat n={progress.puzzlesSolved} label="Puzzles" />
        <Stat n={progress.gamesWon} label="Wins" />
        <Stat n={progress.gamesPlayed} label="Games" />
      </View>

      {/* Achievements */}
      <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
      <Card>
        <View style={styles.badges}>
          {ACHIEVEMENTS.map((a) => {
            const earned = progress.achievements.includes(a.id);
            return (
              <View key={a.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                <View style={[styles.badgeCircle, earned && { backgroundColor: colors.gold }]}>
                  <Icon name={(earned ? a.icon : 'lock-closed') as IconName} size={18} color={earned ? colors.ink : colors.textFaint} />
                </View>
                <Text style={[styles.badgeTitle, !earned && { color: colors.textFaint }]}>{a.title}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 118,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  iconSquare: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconGlyph: { fontSize: 24, color: '#fff' },
  tileTitle: { fontSize: 19, fontWeight: '800', color: colors.ink, marginTop: spacing.sm },
  tileSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },

  progressCard: { marginTop: spacing.md, backgroundColor: colors.ink },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelText: { color: colors.onDark, fontSize: 17, fontWeight: '800' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  xpTrack: { height: 8, backgroundColor: '#2E2E33', borderRadius: 999, marginTop: spacing.sm, overflow: 'hidden' },
  xpFill: { height: 8, backgroundColor: colors.gold, borderRadius: 999 },
  progressBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressMeta: { color: '#C9C9CF', fontSize: 11.5 },
  goalTrack: { height: 6, backgroundColor: '#2E2E33', borderRadius: 999, marginTop: 6, overflow: 'hidden' },
  goalFill: { height: 6, backgroundColor: colors.success, borderRadius: 999 },

  liveCard: { backgroundColor: colors.dark },
  liveTag: { color: colors.danger, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  liveMatch: { ...typography.h3, color: colors.onDark, marginTop: spacing.xs },
  liveMeta: { color: '#B9B9C0', fontSize: 12 },

  sectionLabel: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontSize: 24, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textFaint, marginTop: 2 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { alignItems: 'center', width: 70 },
  badgeLocked: { opacity: 0.7 },
  badgeCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeTitle: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2, color: colors.ink },
});
