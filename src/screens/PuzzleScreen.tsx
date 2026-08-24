import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, spacing, typography } from '../theme';
import { puzzles, puzzleThemes } from '../data/puzzles';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Puzzle'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function PuzzleScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader title="Puzzle" onProfile={() => navigation.navigate('Profile')} />
      <Text style={[typography.muted, { marginBottom: spacing.sm }]}>
        Solve tactics by topic. Tap a puzzle and play the winning move on the board.
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
  themeHeader: { ...typography.label, color: colors.gold, marginTop: spacing.md, marginBottom: spacing.sm },
});
