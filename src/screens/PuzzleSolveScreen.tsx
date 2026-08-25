import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { puzzles } from '../data/puzzles';
import { legalTargets, tryMove, isOwnPiece, checkedKingSquare } from '../game/chessHelpers';
import { useProgress, XP_PUZZLE } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PuzzleSolve'>;
type Status = 'idle' | 'wrong' | 'solved';

export function PuzzleSolveScreen({ route, navigation }: Props) {
  const puzzle = route.params.puzzle ?? puzzles.find((p) => p.id === route.params.id) ?? puzzles[0];
  const gameRef = useRef(new Chess(puzzle.fen));
  const solIndexRef = useRef(0);
  const awardedRef = useRef(false);
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 360);
  const { awardPuzzleSolved } = useProgress();

  const playerColor = new Chess(puzzle.fen).turn(); // 'w' | 'b'
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const solve = useCallback(() => {
    setStatus('solved');
    if (!awardedRef.current) {
      awardedRef.current = true;
      awardPuzzleSolved();
    }
  }, [awardPuzzleSolved]);

  const reset = useCallback(() => {
    gameRef.current = new Chess(puzzle.fen);
    solIndexRef.current = 0;
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
          const expected = puzzle.solution[solIndexRef.current];
          if (mv.san === expected) {
            solIndexRef.current += 1;
            setLastMove({ from: mv.from, to: mv.to });
            setSelected(null);
            setHighlights([]);
            setFen(game.fen());
            if (solIndexRef.current >= puzzle.solution.length) {
              solve();
            } else {
              // auto-play the opponent's reply
              setTimeout(() => {
                const reply = game.move(puzzle.solution[solIndexRef.current]);
                solIndexRef.current += 1;
                if (reply) setLastMove({ from: reply.from, to: reply.to });
                setFen(game.fen());
                if (solIndexRef.current >= puzzle.solution.length) solve();
              }, 350);
            }
          } else {
            game.undo();
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
    [selected, status, puzzle.solution, solve],
  );

  const showSolution = useCallback(() => {
    const game = new Chess(puzzle.fen);
    let last: { from: string; to: string } | null = null;
    for (const san of puzzle.solution) {
      const mv = game.move(san);
      if (mv) last = { from: mv.from, to: mv.to };
    }
    gameRef.current = game;
    solIndexRef.current = puzzle.solution.length;
    setLastMove(last);
    setSelected(null);
    setHighlights([]);
    setFen(game.fen());
    setStatus('solved');
  }, [puzzle.fen, puzzle.solution]);

  const sideLabel = playerColor === 'w' ? 'White' : 'Black';
  const banner: { text: string; color: string; icon: IconName } =
    status === 'solved'
      ? { text: `Solved!  +${XP_PUZZLE} XP`, color: colors.success, icon: 'checkmark-circle' }
      : status === 'wrong'
        ? { text: 'Not the winning move — try again', color: colors.danger, icon: 'close-circle' }
        : {
            text: puzzle.kind === 'mate' ? 'Find the checkmate' : puzzle.kind === 'win' ? 'Win material' : 'Find the best move',
            color: colors.textMuted,
            icon: 'search',
          };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title} numberOfLines={1}>{puzzle.title}</Text>
        <View style={{ width: 40 }} />
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
          checkSquare={checkedKingSquare(gameRef.current)}
          flipped={playerColor === 'b'}
        />
      </View>

      <View style={styles.banner}>
        <Icon name={banner.icon} size={20} color={banner.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerText, { color: banner.color }]}>{banner.text}</Text>
          <Text style={styles.hint}>{sideLabel} to move</Text>
        </View>
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
  back: { fontSize: 30, width: 40, color: colors.ink },
  title: { ...typography.h3, flex: 1, textAlign: 'center' },
  theme: { ...typography.label, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  boardWrap: { alignItems: 'center', marginVertical: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bannerText: { fontSize: 15, fontWeight: '700' },
  hint: { ...typography.muted, marginTop: 1 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});
