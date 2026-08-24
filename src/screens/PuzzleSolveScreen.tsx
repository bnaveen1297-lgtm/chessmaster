import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { puzzles } from '../data/puzzles';
import { legalTargets, tryMove, isOwnPiece } from '../game/chessHelpers';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PuzzleSolve'>;
type Status = 'idle' | 'wrong' | 'solved';

export function PuzzleSolveScreen({ route, navigation }: Props) {
  const puzzle = puzzles.find((p) => p.id === route.params.id) ?? puzzles[0];
  const gameRef = useRef(new Chess(puzzle.fen));
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 360);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const reset = useCallback(() => {
    gameRef.current = new Chess(puzzle.fen);
    setFen(gameRef.current.fen());
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    setStatus('idle');
  }, [puzzle.fen]);

  const onSquarePress = useCallback(
    (square: string) => {
      if (status === 'solved') return;
      const game = gameRef.current;

      if (selected) {
        const mv = tryMove(game, selected, square);
        if (mv) {
          if (mv.san === puzzle.solution[0]) {
            setLastMove({ from: mv.from, to: mv.to });
            setSelected(null);
            setHighlights([]);
            setFen(game.fen());
            setStatus('solved');
          } else {
            game.undo(); // wrong — take it back
            setSelected(null);
            setHighlights([]);
            setStatus('wrong');
          }
          return;
        }
      }
      if (isOwnPiece(game, square)) {
        setSelected(square);
        setHighlights(legalTargets(game, square));
        if (status === 'wrong') setStatus('idle');
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, status, puzzle.solution],
  );

  const showSolution = useCallback(() => {
    const game = new Chess(puzzle.fen);
    const mv = game.move(puzzle.solution[0]);
    gameRef.current = game;
    if (mv) setLastMove({ from: mv.from, to: mv.to });
    setFen(game.fen());
    setSelected(null);
    setHighlights([]);
    setStatus('solved');
  }, [puzzle.fen, puzzle.solution]);

  const banner =
    status === 'solved'
      ? { text: `Solved! ${puzzle.solution[0]}`, color: colors.success }
      : status === 'wrong'
        ? { text: 'Not the winning move — try again', color: colors.danger }
        : { text: puzzle.kind === 'mate' ? 'Find the checkmate' : 'Win material', color: colors.textMuted };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>{puzzle.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.theme}>{puzzle.theme} · {puzzle.difficulty}</Text>

      <View style={styles.boardWrap}>
        <ChessBoard
          fen={fen}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          lastMove={lastMove}
        />
      </View>

      <View style={[styles.banner, { borderColor: banner.color }]}>
        <Text style={[styles.bannerText, { color: banner.color }]}>{banner.text}</Text>
        <Text style={styles.hint}>White to move</Text>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}><Button label="Reset" variant="outline" onPress={reset} /></View>
        <View style={{ flex: 1 }}>
          <Button
            label={status === 'solved' ? 'Back to puzzles' : 'Show solution'}
            onPress={status === 'solved' ? () => navigation.goBack() : showSolution}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 30, width: 24, color: colors.ink },
  title: { ...typography.h3 },
  theme: { ...typography.muted, textAlign: 'center', marginTop: 2 },
  boardWrap: { alignItems: 'center', marginVertical: spacing.md },
  banner: { borderWidth: 1.5, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  bannerText: { fontSize: 15, fontWeight: '700' },
  hint: { ...typography.muted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});
