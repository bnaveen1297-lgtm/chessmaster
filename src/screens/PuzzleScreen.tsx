import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { puzzles, puzzleThemes } from '../data/puzzles';
import { fetchRandomPuzzle } from '../services/puzzleApi';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Puzzle'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function PuzzleScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const randomPuzzle = useCallback(async () => {
    setLoading(true);
    try {
      const puzzle = await fetchRandomPuzzle();
      navigation.navigate('PuzzleSolve', { puzzle });
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  return (
    <Screen>
      <AppHeader title="Puzzle" onProfile={() => navigation.navigate('Profile')} />

      <Card style={styles.online} onPress={loading ? undefined : randomPuzzle}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineGlyph}><Icon name="infinite" size={26} color={colors.onDark} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.onlineTitle}>Unlimited puzzles</Text>
            <Text style={styles.onlineSub}>Fresh tactics from free chess APIs</Text>
          </View>
          {loading ? <ActivityIndicator color={colors.onDark} /> : <Text style={styles.onlineCta}>Play ›</Text>}
        </View>
      </Card>

      <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
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
  online: { backgroundColor: colors.ink, borderColor: colors.ink },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  onlineGlyph: { width: 28, alignItems: 'center' },
  onlineTitle: { ...typography.h3, color: colors.onDark },
  onlineSub: { ...typography.muted, color: '#C9C9CF' },
  onlineCta: { color: colors.gold, fontWeight: '800' },
});
