import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen, Card, SectionHeader } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, spacing, typography } from '../theme';
import { useProgress, levelFromXp, xpIntoLevel, XP_PER_LEVEL, ACHIEVEMENTS } from '../game/ProgressContext';
import { useAuth } from '../auth/AuthContext';
import { fetchRandomPuzzle } from '../services/puzzleApi';
import { liveGames } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const { user } = useAuth();
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const level = levelFromXp(progress.xp);
  const into = xpIntoLevel(progress.xp);
  const live = liveGames.find((g) => g.status === 'live')!;

  const dailyPuzzle = useCallback(async () => {
    setLoadingPuzzle(true);
    try {
      const puzzle = await fetchRandomPuzzle();
      navigation.navigate('PuzzleSolve', { puzzle });
    } finally {
      setLoadingPuzzle(false);
    }
  }, [navigation]);

  const goalPct = Math.min(1, progress.dailyGoal ? progress.solvedToday / progress.dailyGoal : 0);

  return (
    <Screen>
      <AppHeader title={`Hi, ${user?.firstName || 'Champion'} 👋`} onProfile={() => navigation.navigate('Profile')} />

      {/* Level / XP hero */}
      <Card style={styles.hero}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={styles.levelNum}>{level}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNum}>{progress.streakDays}</Text>
            <Text style={styles.streakLabel}>🔥 day streak</Text>
          </View>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${(into / XP_PER_LEVEL) * 100}%` }]} />
        </View>
        <Text style={styles.xpText}>{into} / {XP_PER_LEVEL} XP to level {level + 1}</Text>
      </Card>

      {/* Daily goal */}
      <Card>
        <View style={styles.rowBetween}>
          <Text style={typography.h3}>Daily goal</Text>
          <Text style={styles.goalCount}>{progress.solvedToday}/{progress.dailyGoal} puzzles</Text>
        </View>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${goalPct * 100}%` }]} />
        </View>
        <Text style={typography.muted}>
          {goalPct >= 1 ? '🎉 Goal complete — nice work!' : 'Solve puzzles to keep your streak alive.'}
        </Text>
      </Card>

      {/* Quick actions */}
      <SectionHeader title="Jump in" />
      <View style={styles.grid}>
        <Action glyph="🧩" title="Daily puzzle" subtitle={loadingPuzzle ? 'Loading…' : 'Fresh tactic'} onPress={dailyPuzzle} busy={loadingPuzzle} />
        <Action glyph="🤖" title="Play computer" subtitle="Beat the engine" onPress={() => navigation.navigate('PlayVsComputer')} />
        <Action glyph="👥" title="Play a friend" subtitle="Pass & play" onPress={() => navigation.navigate('PlayLocal')} />
        <Action glyph="📚" title="Learn" subtitle="Lessons" onPress={() => navigation.navigate('Class')} />
      </View>

      {/* Live */}
      <Card style={styles.liveCard} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
        <Text style={styles.liveTag}>● OLYMPIAD LIVE</Text>
        <Text style={styles.liveMatch}>{live.white} vs {live.black}</Text>
        <Text style={styles.liveMeta}>{live.event}</Text>
      </Card>

      {/* Stats */}
      <SectionHeader title="Your stats" />
      <View style={styles.statRow}>
        <Stat n={progress.puzzlesSolved} label="Puzzles" />
        <Stat n={progress.gamesWon} label="Wins" />
        <Stat n={progress.gamesPlayed} label="Games" />
      </View>

      {/* Achievements */}
      <SectionHeader title="Achievements" />
      <Card>
        <View style={styles.badges}>
          {ACHIEVEMENTS.map((a) => {
            const earned = progress.achievements.includes(a.id);
            return (
              <View key={a.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                <Text style={styles.badgeEmoji}>{earned ? a.emoji : '🔒'}</Text>
                <Text style={[styles.badgeTitle, !earned && { color: colors.textFaint }]}>{a.title}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

function Action({ glyph, title, subtitle, onPress, busy }: { glyph: string; title: string; subtitle: string; onPress: () => void; busy?: boolean }) {
  return (
    <Card style={styles.action} onPress={onPress}>
      {busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.actionGlyph}>{glyph}</Text>}
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={typography.muted}>{subtitle}</Text>
    </Card>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, borderColor: colors.ink },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelLabel: { color: '#B7AAD9', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  levelNum: { color: colors.onDark, fontSize: 40, fontWeight: '900', lineHeight: 44 },
  streakBadge: { alignItems: 'flex-end' },
  streakNum: { color: colors.gold, fontSize: 26, fontWeight: '900' },
  streakLabel: { color: '#C9C9CF', fontSize: 12, fontWeight: '600' },
  xpTrack: { height: 10, backgroundColor: '#2A2A2E', borderRadius: 999, marginTop: spacing.md, overflow: 'hidden' },
  xpFill: { height: 10, backgroundColor: colors.gold, borderRadius: 999 },
  xpText: { color: '#C9C9CF', fontSize: 12, marginTop: 6 },
  goalCount: { ...typography.muted, fontWeight: '700', color: colors.ink },
  goalTrack: { height: 8, backgroundColor: colors.bgAlt, borderRadius: 999, marginVertical: spacing.sm, overflow: 'hidden' },
  goalFill: { height: 8, backgroundColor: colors.success, borderRadius: 999 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: { width: '47%', marginBottom: 0, minHeight: 96, justifyContent: 'center' },
  actionGlyph: { fontSize: 24 },
  actionTitle: { ...typography.h3, marginTop: spacing.xs },
  liveCard: { backgroundColor: colors.dark, borderColor: colors.dark, marginTop: spacing.md },
  liveTag: { color: colors.danger, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  liveMatch: { ...typography.h3, color: colors.onDark, marginTop: spacing.xs },
  liveMeta: { color: '#B9B9C0', fontSize: 12 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontSize: 24, fontWeight: '900', color: colors.ink },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { alignItems: 'center', width: 72 },
  badgeLocked: { opacity: 0.6 },
  badgeEmoji: { fontSize: 26 },
  badgeTitle: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2, color: colors.ink },
});
