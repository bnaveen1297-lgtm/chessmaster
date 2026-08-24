import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../components/ChessBoard';
import { colors, radius, spacing, typography } from '../theme';
import { puzzles } from '../data/content';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PuzzleSolve'>;

export function PuzzleSolveScreen({ route, navigation }: Props) {
  const puzzle = puzzles.find((p) => p.id === route.params.id) ?? puzzles[0];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>{puzzle.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.boardWrap}>
        <ChessBoard fen={puzzle.fen} size={330} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.turn}>Your Turn</Text>
        <Text style={styles.hint}>Find the best move for {puzzle.toMove}</Text>
        <View style={styles.nav}>
          <Text style={styles.navArrow}>◀</Text>
          <Text style={styles.counter}>1/{puzzle.total}</Text>
          <Text style={styles.navArrow}>▶</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark, padding: spacing.md, justifyContent: 'space-between' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.onDark, fontSize: 30, width: 40 },
  title: { ...typography.h3, color: colors.onDark },
  boardWrap: { alignItems: 'center' },
  panel: { alignItems: 'center', backgroundColor: colors.darkAlt, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  turn: { ...typography.h2, color: colors.onDark },
  hint: { color: '#C9C9CF' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.sm },
  navArrow: { color: colors.onDark, fontSize: 18 },
  counter: { color: colors.gold, fontWeight: '700' },
});
