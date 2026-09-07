import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { puzzles, puzzleThemes } from '../data/puzzles';
import { fetchNextPuzzle, fetchDailyPuzzle, puzzleDbAvailable, type PuzzleFilter } from '../services/puzzleDb';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Puzzle'>,
  NativeStackScreenProps<RootStackParamList>
>;

const BANDS: { key: string; label: string; filter: PuzzleFilter }[] = [
  { key: 'any', label: 'Any', filter: {} },
  { key: 'beg', label: 'Beginner', filter: { maxRating: 1400 } },
  { key: 'int', label: 'Intermediate', filter: { minRating: 1400, maxRating: 1900 } },
  { key: 'adv', label: 'Advanced', filter: { minRating: 1900 } },
];

export function PuzzleScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [band, setBand] = useState('any');
  const [error, setError] = useState<string | null>(null);
  const hasDb = puzzleDbAvailable();

  const randomPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = BANDS.find((b) => b.key === band)?.filter ?? {};
      const puzzle = await fetchNextPuzzle(filter);
      navigation.navigate('PuzzleSolve', { puzzle });
    } catch (e: any) {
      setError(e?.message ?? 'Could not load a puzzle.');
    } finally {
      setLoading(false);
    }
  }, [navigation, band]);

  const dailyPuzzle = useCallback(async () => {
    setDailyLoading(true);
    setError(null);
    try {
      const puzzle = await fetchDailyPuzzle();
      navigation.navigate('PuzzleSolve', { puzzle });
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the daily puzzle.');
    } finally {
      setDailyLoading(false);
    }
  }, [navigation]);

  return (
    <Screen>
      <AppHeader eyebrow="TACTICS" title="Puzzle" onProfile={() => navigation.navigate('Profile')} />

      {/* Daily puzzle — same for everyone, changes each day */}
      <Card style={styles.daily} onPress={dailyLoading ? undefined : dailyPuzzle}>
        <View style={styles.dailyGlyph}><Icon name="today" size={22} color={colors.ink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dailyTitle}>Daily Puzzle</Text>
          <Text style={styles.dailySub}>One fresh puzzle every day · from Lichess</Text>
        </View>
        {dailyLoading ? <ActivityIndicator color={colors.ink} /> : <Icon name="chevron-forward" size={20} color="rgba(20,20,20,0.5)" />}
      </Card>

      {/* Unlimited — millions from the puzzle database, else free APIs */}
      <Card style={styles.online} onPress={loading ? undefined : randomPuzzle}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineGlyph}><Icon name="infinite" size={26} color={colors.onDark} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.onlineTitle}>{hasDb ? 'Millions of puzzles' : 'Unlimited puzzles'}</Text>
            <Text style={styles.onlineSub}>{hasDb ? 'The Lichess puzzle database, by level' : 'Fresh tactics from free chess APIs'}</Text>
          </View>
          {loading ? <ActivityIndicator color={colors.onDark} /> : <Text style={styles.onlineCta}>Play ›</Text>}
        </View>
        <View style={styles.bandRow}>
          {BANDS.map((b) => (
            <Pressable key={b.key} onPress={() => setBand(b.key)} style={[styles.band, band === b.key && styles.bandOn]}>
              <Text style={[styles.bandText, band === b.key && styles.bandTextOn]}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={[typography.muted, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>
        Or solve curated tactics by topic. Tap a puzzle and play the winning move.
      </Text>

      {puzzleThemes.map((theme) => (
        <View key={theme}>
          <Text style={styles.themeHeader}>{theme}</Text>
          {puzzles
            .filter((p) => p.theme === theme)
            .map((p) => (
              <Card key={p.id} onPress={() => navigation.navigate('PuzzleSolve', { id: p.id })}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{p.title}</Text>
                    <Text style={typography.muted}>
                      {p.kind === 'mate' ? 'Find the checkmate' : 'Win material'} · White to move
                    </Text>
                  </View>
                  <Pill label={p.difficulty} tone={p.difficulty === 'Beginner' ? 'success' : 'gold'} />
                </View>
              </Card>
            ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  themeHeader: { ...typography.label, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },

  daily: { backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dailyGlyph: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  dailyTitle: { ...typography.h3, color: colors.ink },
  dailySub: { ...typography.muted, color: 'rgba(20,20,20,0.7)' },

  online: { backgroundColor: colors.ink, borderColor: colors.ink },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  onlineGlyph: { width: 28, alignItems: 'center' },
  onlineTitle: { ...typography.h3, color: colors.onDark },
  onlineSub: { ...typography.muted, color: '#C9C9CF' },
  onlineCta: { color: colors.gold, fontWeight: '800' },
  bandRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  band: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  bandOn: { backgroundColor: '#fff' },
  bandText: { fontSize: 12, fontWeight: '700', color: '#C9C9CF' },
  bandTextOn: { color: colors.ink },

  error: { ...typography.muted, color: colors.danger, marginTop: spacing.sm },
});
