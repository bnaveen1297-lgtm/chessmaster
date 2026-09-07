import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button, Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { bestMove, LEVELS, type Level } from '../engine/ai';
import { legalTargets, tryMove, isOwnPiece, statusText, checkedKingSquare } from '../game/chessHelpers';
import { useProgress } from '../game/ProgressContext';
import { saveGame } from '../game/history';
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
      const result = g.isCheckmate() ? (g.turn() === 'w' ? '0-1' : '1-0') : '1/2-1/2';
      saveGame({ mode: 'computer', result, pgn: g.pgn(), white: 'You', black: `Computer (${level.label})` });
    }
  }, [awardGameResult, level.label]);

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

  const game = gameRef.current;
  const gameOver = game.isGameOver();
  const turnName = game.turn() === 'w' ? 'White' : 'Black';
  const statusLine = gameOver
    ? statusText(game)
    : thinking
      ? 'Computer is thinking…'
      : `${turnName} to move${game.inCheck() ? ' — check!' : ''}`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>Play vs Computer</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.sectionLabel}>DIFFICULTY</Text>
      <Segmented
        options={LEVELS.map((l) => l.label)}
        value={level.label}
        onChange={(label) => {
          const next = LEVELS.find((l) => l.label === label);
          if (next) setLevel(next);
        }}
      />

      {/* Opponent (top) */}
      <View style={styles.playerRow}>
        <View style={styles.playerLeft}>
          <View style={styles.opponentGlyph}>
            <Icon name="hardware-chip" size={16} color={colors.onDark} />
          </View>
          <Text style={styles.playerName}>Computer</Text>
        </View>
        {thinking && <ActivityIndicator color={colors.textMuted} size="small" />}
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

      {/* Player (bottom) */}
      <View style={styles.playerRow}>
        <View style={styles.playerLeft}>
          <View style={styles.turnDot} />
          <Text style={styles.playerName}>You · White</Text>
        </View>
      </View>

      <View style={[styles.status, gameOver && styles.statusOver]}>
        <Text style={[styles.statusText, gameOver && { color: colors.gold }]}>{statusLine}</Text>
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
  back: { fontSize: 30, width: 40, color: colors.ink },
  title: { ...typography.h3 },
  sectionLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs },
  playerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, minHeight: 30 },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  opponentGlyph: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  turnDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F4F1E8' },
  playerName: { ...typography.body, fontWeight: '700' },
  boardWrap: { alignItems: 'center', marginVertical: spacing.sm },
  status: { alignItems: 'center', paddingVertical: spacing.sm },
  statusOver: { backgroundColor: colors.ink, borderRadius: radius.md },
  statusText: { ...typography.body, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
