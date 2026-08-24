import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, spacing, typography } from '../theme';
import { puzzles } from '../data/content';
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
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        Solve puzzles assigned by your coach and keep your streak alive.
      </Text>

      {puzzles.map((p) => {
        const solved = p.solved === p.total && p.total > 0;
        return (
          <Card key={p.id} onPress={() => navigation.navigate('PuzzleSolve', { id: p.id })}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{p.title}</Text>
                <Text style={typography.muted}>Deadline: {p.deadline}</Text>
                <Text style={styles.solved}>
                  Solved {String(p.solved).padStart(2, '0')}/{p.total}
                </Text>
              </View>
              <Pill label={solved ? 'SOLVED' : 'SOLVE ›'} tone={solved ? 'success' : 'gold'} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  solved: { ...typography.muted, marginTop: spacing.xs, color: colors.textFaint },
});
