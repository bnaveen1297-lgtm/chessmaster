import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, Pill, SectionHeader } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, radius, spacing, typography } from '../theme';
import { gameModes, openTournaments, liveGames } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Game'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function GameScreen({ navigation }: Props) {
  const live = liveGames.find((g) => g.status === 'live')!;

  return (
    <Screen>
      <AppHeader title="Game" onProfile={() => navigation.navigate('Profile')} />

      {/* ChessMaster power features */}
      <View style={styles.featureRow}>
        <Card style={[styles.feature, { backgroundColor: colors.dark, borderColor: colors.dark }]} onPress={() => navigation.navigate('Analyze')}>
          <Text style={styles.featureGlyph}>🔍</Text>
          <Text style={styles.featureTitleDark}>Analyze your games</Text>
          <Text style={styles.featureBlurbDark}>Import from Chess.com, Lichess or PGN.</Text>
        </Card>
        <Card style={[styles.feature, { backgroundColor: colors.gold, borderColor: colors.gold }]} onPress={() => navigation.navigate('Coach')}>
          <Text style={styles.featureGlyph}>🧠</Text>
          <Text style={styles.featureTitle}>Prep Coach</Text>
          <Text style={styles.featureBlurb}>Build a plan for your next tournament.</Text>
        </Card>
      </View>

      <Card style={styles.live} onPress={() => navigation.navigate('LiveGame', { id: live.id })}>
        <View style={styles.rowBetween}>
          <Pill label="OLYMPIAD LIVE" tone="live" />
          <Text style={styles.eval}>{live.eval}</Text>
        </View>
        <Text style={styles.liveMatch}>{live.white} vs {live.black}</Text>
        <Text style={typography.muted}>{live.event}</Text>
      </Card>

      <SectionHeader title="Play" />
      <View style={styles.modeGrid}>
        {gameModes.map((m) => (
          <Card key={m.id} style={styles.mode}>
            <Text style={styles.modeGlyph}>{m.glyph}</Text>
            <Text style={typography.h3}>{m.title}</Text>
            <Text style={typography.muted}>{m.blurb}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Open tournaments" action="See all" />
      {openTournaments.map((t) => (
        <Card key={t.id}>
          <View style={styles.rowBetween}>
            <Text style={typography.h3}>{t.name}</Text>
            <Pill label={`starts ${t.startsIn}`} />
          </View>
          <Text style={typography.muted}>{t.format}</Text>
          <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
            <Text style={typography.label}>{t.players.toLocaleString()} PLAYERS</Text>
            <Button label="Join" small />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  featureRow: { flexDirection: 'row', gap: spacing.md },
  feature: { flex: 1, minHeight: 130 },
  featureGlyph: { fontSize: 24, marginBottom: spacing.sm },
  featureTitle: { ...typography.h3, color: colors.ink },
  featureBlurb: { ...typography.muted, color: 'rgba(20,20,20,0.75)' },
  featureTitleDark: { ...typography.h3, color: colors.onDark },
  featureBlurbDark: { ...typography.muted, color: '#B9B9C0' },
  live: { marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eval: { ...typography.h3, color: colors.gold },
  liveMatch: { ...typography.h3, marginTop: spacing.sm },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mode: { width: '47%', marginBottom: 0 },
  modeGlyph: { fontSize: 22, marginBottom: spacing.xs },
});
