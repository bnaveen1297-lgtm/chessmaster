import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Card } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { useProgress, levelFromXp, xpIntoLevel, XP_PER_LEVEL, ACHIEVEMENTS } from '../game/ProgressContext';
import { useAuth } from '../auth/AuthContext';
import { liveGames } from '../data/content';
import { daysUntilOlympiad, olympiadDates } from '../data/olympiad';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TILES: { key: string; title: string; subtitle: string; icon: IconName; color: string }[] = [
  { key: 'play', title: 'Play', subtitle: 'Beat the engine', icon: 'play', color: colors.tint },
  { key: 'learn', title: 'Learn', subtitle: 'Lessons & openings', icon: 'book', color: '#1F9E7A' },
  { key: 'analyse', title: 'Analyse', subtitle: 'Review your games', icon: 'stats-chart', color: '#E08A2B' },
  { key: 'game', title: 'Game', subtitle: 'Tournaments & friends', icon: 'trophy', color: '#E0568A' },
];

function greeting() {
  return 'WELCOME BACK';
}

export function HomeScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const { user } = useAuth();
  const level = levelFromXp(progress.xp);
  const into = xpIntoLevel(progress.xp);
  const live = liveGames.find((g) => g.status === 'live')!;
  const olyDays = daysUntilOlympiad();
  const goalPct = Math.min(1, progress.dailyGoal ? progress.solvedToday / progress.dailyGoal : 0);

  const onTile = (key: string) => {
    if (key === 'play') navigation.navigate('PlayVsComputer');
    else if (key === 'learn') navigation.navigate('Class');
    else if (key === 'analyse') navigation.navigate('Analyze');
    else navigation.navigate('Game');
  };

  return (
    <Screen>
      <AppHeader
        eyebrow={greeting()}
        title={user?.firstName || 'Champion'}
        onProfile={() => navigation.navigate('Profile')}
      />

      {/* Four primary destinations — the first thing you see */}
      <View style={styles.grid}>
        {TILES.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => onTile(t.key)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            <View style={[styles.iconSquare, { backgroundColor: t.color }]}>
              <Icon name={t.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSub}>{t.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {/* Dark hero: today's progress (the single dark surface, Apple Fitness-style) */}
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

      {/* Olympiad — the reason to launch now: Samarkand 2026 countdown */}
      <Text style={styles.sectionLabel}>THE OLYMPIAD</Text>
      <Card style={styles.olympiadCard} onPress={() => navigation.navigate('Olympiad')}>
        <View style={styles.olympiadTop}>
          <Text style={styles.olympiadEyebrow}>SAMARKAND · UZBEKISTAN</Text>
          <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.olympiadTitle}>46th FIDE Chess Olympiad</Text>
        <View style={styles.olympiadCountRow}>
          <Text style={styles.olympiadDays}>{olyDays}</Text>
          <Text style={styles.olympiadDaysLabel}>days to go · {olympiadDates}</Text>
        </View>
      </Card>

      {/* Featured masterpiece + Master Base */}
      <Text style={styles.sectionLabel}>MASTER BASE</Text>
      <Card onPress={() => navigation.navigate('MasterGame', { id: 'opera-1858' })}>
        <View style={styles.liveRow}>
          <View style={[styles.mbGlyph]}><Icon name="play" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveMatch}>{live.white} vs {live.black}</Text>
            <Text style={styles.liveMeta}>{live.event} · watch, play or analyse</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textFaint} />
        </View>
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
    minHeight: 116,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  iconSquare: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: spacing.sm, letterSpacing: -0.3 },
  tileSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },

  progressCard: { marginTop: spacing.md, backgroundColor: colors.ink },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelText: { color: colors.onDark, fontSize: 17, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  xpTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, marginTop: spacing.sm, overflow: 'hidden' },
  xpFill: { height: 8, backgroundColor: colors.gold, borderRadius: 999 },
  progressBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 11.5 },
  goalTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, marginTop: 6, overflow: 'hidden' },
  goalFill: { height: 6, backgroundColor: colors.success, borderRadius: 999 },

  liveCard: {},
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveMatch: { ...typography.h3, color: colors.ink },
  liveMeta: { color: colors.textMuted, fontSize: 12.5, marginTop: 1 },
  mbGlyph: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },

  olympiadCard: { backgroundColor: colors.samarkandDeep },
  olympiadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  olympiadEyebrow: { color: colors.samarkandTile, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  olympiadTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 6, letterSpacing: -0.2 },
  olympiadCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  olympiadDays: { color: colors.gold, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  olympiadDaysLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, flex: 1 },

  sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { alignItems: 'center', width: 70 },
  badgeLocked: { opacity: 0.7 },
  badgeCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  badgeTitle: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 2, color: colors.ink },
});
