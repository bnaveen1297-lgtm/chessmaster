import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { bestMove, LEVELS, type Level } from '../engine/ai';
import { legalTargets, tryMove, isOwnPiece, statusText, checkedKingSquare } from '../game/chessHelpers';
import { useProgress } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PlayVsComputer'>;

const PLAYER = 'w'; // human plays White

export function PlayVsComputerScreen({ navigation }: Props) {
  const gameRef = useRef(new Chess());
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 380);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [level, setLevel] = useState<Level>(LEVELS[1]);
  const [thinking, setThinking] = useState(false);
  const { awardGameResult } = useProgress();
  const awardedRef = useRef(false);

  const sync = useCallback(() => {
    setFen(gameRef.current.fen());
  }, []);

  const maybeAward = useCallback(() => {
    const g = gameRef.current;
    if (g.isGameOver() && !awardedRef.current) {
      awardedRef.current = true;
      // Player is White; black-to-move at checkmate means White delivered it.
      const won = g.isCheckmate() && g.turn() === 'b';
      awardGameResult(won);
    }
  }, [awardGameResult]);

  const runEngine = useCallback(() => {
    const game = gameRef.current;
    if (game.isGameOver() || game.turn() === PLAYER) return;
    setThinking(true);
    // Defer so the player's move paints before the (blocking) search runs.
    setTimeout(() => {
      const san = bestMove(game.fen(), level.depth);
      if (san) {
        const mv = game.move(san);
        if (mv) setLastMove({ from: mv.from, to: mv.to });
      }
      setThinking(false);
      sync();
      maybeAward();
    }, 250);
  }, [level.depth, sync, maybeAward]);

  const onSquarePress = useCallback(
    (square: string) => {
      const game = gameRef.current;
      if (thinking || game.isGameOver() || game.turn() !== PLAYER) return;

      if (selected) {
        const mv = tryMove(game, selected, square);
        if (mv) {
          setSelected(null);
          setHighlights([]);
          setLastMove({ from: mv.from, to: mv.to });
          sync();
          maybeAward();
          runEngine();
          return;
        }
      }
      // (Re)select if tapping an own piece; otherwise clear.
      if (isOwnPiece(game, square)) {
        setSelected(square);
        setHighlights(legalTargets(game, square));
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, thinking, sync, runEngine, maybeAward],
  );

  const newGame = useCallback(() => {
    gameRef.current = new Chess();
    awardedRef.current = false;
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    setThinking(false);
    sync();
  }, [sync]);

  const undo = useCallback(() => {
    const game = gameRef.current;
    if (thinking) return;
    game.undo(); // engine reply
    game.undo(); // player move
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    sync();
  }, [thinking, sync]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>Play vs Computer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.levels}>
        {LEVELS.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setLevel(l)}
            style={[styles.levelChip, level.id === l.id && styles.levelChipOn]}
          >
            <Text style={[styles.levelText, level.id === l.id && styles.levelTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.status}>{statusText(gameRef.current)}</Text>
        {thinking && <ActivityIndicator color={colors.gold} size="small" />}
      </View>

      <View style={styles.boardWrap}>
        <ChessBoard
          fen={fen}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          lastMove={lastMove}
          checkSquare={checkedKingSquare(gameRef.current)}
        />
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}><Button label="New game" onPress={newGame} /></View>
        <View style={{ flex: 1 }}><Button label="Undo" variant="outline" onPress={undo} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  back: { fontSize: 30, width: 24, color: colors.ink },
  title: { ...typography.h3 },
  levels: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.sm },
  levelChip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.bgAlt },
  levelChipOn: { backgroundColor: colors.ink },
  levelText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  levelTextOn: { color: colors.onDark },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm, minHeight: 22 },
  status: { ...typography.body, fontWeight: '600' },
  boardWrap: { alignItems: 'center', marginVertical: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
