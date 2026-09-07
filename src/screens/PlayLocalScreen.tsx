import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { legalTargets, tryMove, isOwnPiece, statusText, checkedKingSquare } from '../game/chessHelpers';
import { saveGame } from '../game/history';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PlayLocal'>;

/** Two players, one device (pass-and-play). Board auto-flips to the side to move. */
export function PlayLocalScreen({ navigation }: Props) {
  const gameRef = useRef(new Chess());
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 380);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [autoFlip, setAutoFlip] = useState(true);

  const game = gameRef.current;
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const flipped = autoFlip && game.turn() === 'b';
  const gameOver = game.isGameOver();
  const savedRef = useRef(false);

  // Save the finished game to history once.
  useEffect(() => {
    const g = gameRef.current;
    if (g.isGameOver() && !savedRef.current) {
      savedRef.current = true;
      const result = g.isCheckmate() ? (g.turn() === 'w' ? '0-1' : '1-0') : '1/2-1/2';
      saveGame({ mode: 'friend', result, pgn: g.pgn(), white: 'White', black: 'Black' });
    }
    if (!g.isGameOver()) savedRef.current = false;
  }, [fen]);

  const onSquarePress = useCallback(
    (square: string) => {
      const g = gameRef.current;
      if (g.isGameOver()) return;
      if (selected) {
        const mv = tryMove(g, selected, square);
        if (mv) {
          setSelected(null);
          setHighlights([]);
          setLastMove({ from: mv.from, to: mv.to });
          sync();
          return;
        }
      }
      if (isOwnPiece(g, square)) {
        setSelected(square);
        setHighlights(legalTargets(g, square));
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, sync],
  );

  const newGame = useCallback(() => {
    gameRef.current = new Chess();
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    sync();
  }, [sync]);

  const undo = useCallback(() => {
    gameRef.current.undo();
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    sync();
  }, [sync]);

  const turnName = game.turn() === 'w' ? 'White' : 'Black';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>Play with a Friend</Text>
        <Pressable onPress={() => setAutoFlip((v) => !v)} style={styles.flipBtn}>
          <Icon name="swap-vertical" size={16} color={autoFlip ? colors.gold : colors.textFaint} />
          <Text style={[styles.flip, autoFlip && styles.flipOn]}>Flip</Text>
        </Pressable>
      </View>

      {/* Opponent (top) turn chip */}
      <View style={styles.playerRow}>
        <View style={[styles.turnDot, { backgroundColor: flipped ? '#F4F1E8' : '#2B2B30' }]} />
        <Text style={styles.playerName}>{flipped ? 'White' : 'Black'}</Text>
      </View>

      <View style={styles.boardWrap}>
        <ChessBoard
          fen={fen}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          lastMove={lastMove}
          checkSquare={checkedKingSquare(game)}
          flipped={flipped}
        />
      </View>

      {/* Player (bottom) turn chip */}
      <View style={styles.playerRow}>
        <View style={[styles.turnDot, { backgroundColor: flipped ? '#2B2B30' : '#F4F1E8' }]} />
        <Text style={styles.playerName}>{flipped ? 'Black' : 'White'}</Text>
      </View>

      <View style={[styles.status, gameOver && styles.statusOver]}>
        <Text style={[styles.statusText, gameOver && { color: colors.gold }]}>
          {gameOver ? statusText(game) : `${turnName} to move${game.inCheck() ? ' — check!' : ''}`}
        </Text>
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
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flip: { ...typography.muted, fontWeight: '700', color: colors.textFaint },
  flipOn: { color: colors.gold },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  turnDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.border },
  playerName: { ...typography.body, fontWeight: '700' },
  boardWrap: { alignItems: 'center', marginVertical: spacing.sm },
  status: { alignItems: 'center', paddingVertical: spacing.sm },
  statusOver: { backgroundColor: colors.ink, borderRadius: radius.md },
  statusText: { ...typography.body, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
