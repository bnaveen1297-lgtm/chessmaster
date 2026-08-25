import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { legalTargets, tryMove, isOwnPiece, statusText, checkedKingSquare } from '../game/chessHelpers';
import { bestMove } from '../engine/ai';
import { getMasterGame } from '../data/masters';
import { useProgress } from '../game/ProgressContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PlayVsMaster'>;

type Rec = { from: string; to: string; promotion?: string; san: string; color: 'w' | 'b' };

export function PlayVsMasterScreen({ route, navigation }: Props) {
  const master = getMasterGame(route.params.id);
  const side = route.params.side; // human's colour
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 380);
  const { awardGameResult } = useProgress();

  const recorded = useMemo<Rec[]>(() => {
    if (!master) return [];
    const c = new Chess();
    try {
      c.loadPgn(master.pgn);
    } catch {
      return [];
    }
    return (c.history({ verbose: true }) as any[]).map((m) => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
      san: m.san,
      color: m.color,
    }));
  }, [master]);

  const gameRef = useRef(new Chess());
  const onRails = useRef(true);
  const awarded = useRef(false);

  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [matched, setMatched] = useState(0);
  const [offAt, setOffAt] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [msg, setMsg] = useState<string>('You are ' + (side === 'w' ? 'White' : 'Black') + ' — make your move.');

  const game = gameRef.current;
  const opp: 'w' | 'b' = side === 'w' ? 'b' : 'w';
  const sync = useCallback(() => setFen(gameRef.current.fen()), []);
  const gameOver = game.isGameOver();

  // Opponent moves: replay the master's recorded move while on-rails, else engine.
  useEffect(() => {
    if (!master) return;
    if (game.turn() !== opp || game.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    const t = setTimeout(() => {
      if (cancelled) return;
      const g = gameRef.current;
      const ply = g.history().length;
      let played = false;
      if (onRails.current && ply < recorded.length && recorded[ply].color === opp) {
        const r = recorded[ply];
        const mv = g.move({ from: r.from, to: r.to, promotion: r.promotion as any });
        if (mv) {
          setLastMove({ from: mv.from, to: mv.to });
          played = true;
        }
      }
      if (!played) {
        const san = bestMove(g.fen(), 3);
        if (san) {
          const mv = g.move(san);
          if (mv) setLastMove({ from: mv.from, to: mv.to });
        }
      }
      setThinking(false);
      sync();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, master]);

  // Award XP once when the game ends.
  useEffect(() => {
    if (gameOver && !awarded.current && master) {
      awarded.current = true;
      let won = false;
      if (game.isCheckmate()) won = game.turn() !== side; // side to move is mated
      awardGameResult(won);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  const onSquarePress = useCallback(
    (square: string) => {
      const g = gameRef.current;
      if (g.isGameOver() || g.turn() !== side || thinking) return;
      if (selected) {
        const ply = g.history().length;
        const rec = recorded[ply];
        const mv = tryMove(g, selected, square);
        if (mv) {
          setSelected(null);
          setHighlights([]);
          setLastMove({ from: mv.from, to: mv.to });
          if (onRails.current && rec && rec.from === mv.from && rec.to === mv.to) {
            setMatched((n) => n + 1);
            setMsg(`Master move ✓  (${mv.san}) — you matched ${master?.white.split(' ').pop()}'s game.`);
          } else if (onRails.current) {
            onRails.current = false;
            setOffAt(Math.floor(ply / 2) + 1);
            setMsg(
              rec
                ? `Off the master's path — here they played ${rec.san}. The engine takes over now. Try to win!`
                : 'Off-book — the engine takes over now.',
            );
          } else {
            setMsg('Your move.');
          }
          sync();
          return;
        }
      }
      if (isOwnPiece(g, square) && g.get(square as any)?.color === side) {
        setSelected(square);
        setHighlights(legalTargets(g, square));
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, side, thinking, recorded, master, sync],
  );

  const restart = useCallback(() => {
    gameRef.current = new Chess();
    onRails.current = true;
    awarded.current = false;
    setSelected(null);
    setHighlights([]);
    setLastMove(null);
    setMatched(0);
    setOffAt(null);
    setMsg('You are ' + (side === 'w' ? 'White' : 'Black') + ' — make your move.');
    sync();
  }, [side, sync]);

  if (!master) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={typography.body}>Game not found.</Text>
      </SafeAreaView>
    );
  }

  const flipped = side === 'b';
  const oppName = side === 'w' ? master.black : master.white;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title} numberOfLines={1}>vs {oppName}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{master.nickname || master.event}</Text>
        </View>
        <View style={styles.matchChip}>
          <Icon name="checkmark-circle" size={13} color={colors.success} />
          <Text style={styles.matchText}>{matched}</Text>
        </View>
      </View>

      {/* opponent bar */}
      <View style={styles.playerRow}>
        <View style={[styles.turnDot, { backgroundColor: opp === 'w' ? '#F4F1E8' : '#2B2B30' }]} />
        <Text style={styles.playerName}>{oppName}</Text>
        {onRails.current ? (
          <View style={styles.railTag}><Text style={styles.railText}>PLAYING THE REAL GAME</Text></View>
        ) : (
          <View style={[styles.railTag, styles.engineTag]}><Text style={[styles.railText, { color: colors.tint }]}>ENGINE</Text></View>
        )}
        {thinking && <ActivityIndicator size="small" color={colors.textMuted} style={{ marginLeft: 6 }} />}
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

      {/* you bar */}
      <View style={styles.playerRow}>
        <View style={[styles.turnDot, { backgroundColor: side === 'w' ? '#F4F1E8' : '#2B2B30' }]} />
        <Text style={styles.playerName}>You</Text>
        {offAt && <Text style={styles.offNote}>off-book at move {offAt}</Text>}
      </View>

      <View style={[styles.status, gameOver && styles.statusOver]}>
        <Text style={[styles.statusText, gameOver && { color: colors.gold }]}>
          {gameOver ? statusText(game) : msg}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}><Button label="Restart" onPress={restart} /></View>
        <View style={{ flex: 1 }}>
          <Button
            label="Watch original"
            variant="outline"
            onPress={() =>
              navigation.navigate('LiveGame', {
                pgn: master.pgn,
                white: master.white,
                black: master.black,
                event: `${master.event}, ${master.year}`,
                result: master.result,
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  back: { fontSize: 30, width: 32, color: colors.ink },
  title: { ...typography.h3 },
  subtitle: { ...typography.muted, fontSize: 12 },
  matchChip: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 44, justifyContent: 'flex-end' },
  matchText: { ...typography.body, fontWeight: '700', color: colors.success },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  turnDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.border },
  playerName: { ...typography.body, fontWeight: '700' },
  railTag: { backgroundColor: colors.fill, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8, marginLeft: 4 },
  engineTag: { backgroundColor: colors.tint + '18' },
  railText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4, color: colors.textMuted },
  offNote: { ...typography.muted, marginLeft: 'auto', color: colors.warning, fontWeight: '600' },
  boardWrap: { alignItems: 'center', marginVertical: spacing.xs },
  status: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, minHeight: 52, justifyContent: 'center' },
  statusOver: { backgroundColor: colors.ink, borderRadius: radius.md },
  statusText: { ...typography.body, fontWeight: '600', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
