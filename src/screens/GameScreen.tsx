import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen, Card } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { liveGames } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Game'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Dest = keyof RootStackParamList;
const MODES: { key: string; title: string; sub: string; icon: IconName; color: string; dest: Dest; live?: boolean }[] = [
  { key: 'online', title: 'Play Online', sub: 'Real players, live', icon: 'globe', color: colors.tint, dest: 'OnlineLobby', live: true },
  { key: 'tournaments', title: 'Tournaments', sub: 'Round-robin & knockout', icon: 'trophy', color: '#E0568A', dest: 'Tournaments', live: true },
  { key: 'computer', title: 'vs Computer', sub: 'Adjustable engine', icon: 'hardware-chip', color: '#1F9E7A', dest: 'PlayVsComputer' },
  { key: 'friends', title: 'Pass & Play', sub: 'Two on one device', icon: 'people', color: '#E08A2B', dest: 'PlayLocal' },
];

export function GameScreen({ navigation }: Props) {
  const live = liveGames.find((g) => g.status === 'live')!;

  return (
    <Screen>
      <AppHeader eyebrow="PLAY" title="Game" onProfile={() => navigation.navigate('Profile')} />

      <View style={styles.grid}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => navigation.navigate(m.dest as never)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            {m.live && (
              <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
            )}
            <View style={[styles.iconSquare, { backgroundColor: m.color }]}>
              <Icon name={m.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.tileTitle}>{m.title}</Text>
            <Text style={styles.tileSub}>{m.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>IMPROVE</Text>
      <View style={styles.featureRow}>
        <Card style={[styles.feature, { backgroundColor: colors.ink }]} onPress={() => navigation.navigate('Analyze')}>
          <View style={styles.featureGlyph}><Icon name="stats-chart" size={22} color="#fff" /></View>
          <Text style={styles.featureTitleDark}>Analyze games</Text>
          <Text style={styles.featureBlurbDark}>Import from Chess.com, Lichess or PGN.</Text>
        </Card>
        <Card style={[styles.feature, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Coach')}>
          <View style={styles.featureGlyph}><Icon name="bulb" size={22} color={colors.tint} /></View>
          <Text style={styles.featureTitle}>Prep Coach</Text>
          <Text style={styles.featureBlurb}>Build a plan for your next event.</Text>
        </Card>
      </View>

      <Text style={styles.label}>MASTER BASE</Text>
      <Card onPress={() => navigation.navigate('MasterBase')}>
        <View style={styles.liveRow}>
          <View style={styles.mbGlyph}><Icon name="library" size={22} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveMatch}>Play the masters</Text>
            <Text style={typography.muted}>Real GM games — play against their moves or analyse.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textFaint} />
        </View>
      </Card>

      <Text style={styles.label}>FEATURED GAME</Text>
      <Card style={styles.live} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
        <View style={styles.liveRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.liveTagRow}>
              <Icon name="play-circle" size={14} color={colors.gold} />
              <Text style={styles.liveTag}>WATCH & LEARN</Text>
            </View>
            <Text style={styles.liveMatch}>{live.white} vs {live.black}</Text>
            <Text style={typography.muted}>{live.event}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textFaint} />
        </View>
      </Card>
    </Screen>
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
  liveBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontWeight: '700', fontSize: 9, letterSpacing: 0.5 },
  iconSquare: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: spacing.sm, letterSpacing: -0.3 },
  tileSub: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },

  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  featureRow: { flexDirection: 'row', gap: spacing.md },
  feature: { flex: 1, minHeight: 128, marginBottom: 0 },
  featureGlyph: { marginBottom: spacing.sm },
  featureTitle: { ...typography.h3, color: colors.ink },
  featureBlurb: { ...typography.muted },
  featureTitleDark: { ...typography.h3, color: colors.onDark },
  featureBlurbDark: { ...typography.muted, color: '#B9B9C0' },

  mbGlyph: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  live: { marginTop: spacing.sm },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  liveTagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  liveTag: { color: colors.gold, fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  liveMatch: { ...typography.h3, color: colors.ink },
});
