import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { legalTargets, isOwnPiece, checkedKingSquare } from '../game/chessHelpers';
import {
  getMatch,
  subscribeMatch,
  unsubscribe,
  makeMove,
  resign,
  offerDraw,
  acceptDraw,
  getNames,
  type Match,
} from '../services/online';
import { useProgress } from '../game/ProgressContext';
import { saveGame } from '../game/history';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OnlineGame'>;

function rebuild(m: Match | null): Chess {
  const g = new Chess();
  if (!m) return g;
  if (m.pgn && m.pgn.trim()) {
    try {
      g.loadPgn(m.pgn);
      return g;
    } catch {
      /* fall through to fen */
    }
  }
  try {
    g.load(m.fen);
  } catch {
    /* keep start position */
  }
  return g;
}

function outcome(result: string | null, myColor: 'w' | 'b' | null): string {
  if (!result) return '';
  if (result === '1/2-1/2') return 'Draw';
  const whiteWon = result === '1-0';
  if (!myColor) return whiteWon ? 'White wins' : 'Black wins';
  const iWon = (whiteWon && myColor === 'w') || (!whiteWon && myColor === 'b');
  return iWon ? 'You won! 🏆' : 'You lost';
}

export function OnlineGameScreen({ route, navigation }: Props) {
  const { matchId, uid } = route.params;
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 380);
  const { awardGameResult } = useProgress();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const awardedRef = useRef(false);

  const myColor: 'w' | 'b' | null = useMemo(() => {
    if (!match) return null;
    if (match.white_id === uid) return 'w';
    if (match.black_id === uid) return 'b';
    return null; // spectator
  }, [match, uid]);

  const game = useMemo(() => rebuild(match), [match]);
  const lastMove = useMemo(() => {
    const h = game.history({ verbose: true }) as any[];
    const last = h[h.length - 1];
    return last ? { from: last.from, to: last.to } : null;
  }, [game]);

  const load = useCallback(async () => {
    try {
      const m = await getMatch(matchId);
      setMatch(m);
      setNames(await getNames([m.white_id, m.black_id]));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the game.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
    let ch: ReturnType<typeof subscribeMatch> | null = null;
    try {
      ch = subscribeMatch(matchId, (m) => setMatch(m));
    } catch {
      /* offline mode — no realtime */
    }
    return () => unsubscribe(ch);
  }, [matchId, load]);

  // Award XP + save to history once when the game finishes.
  useEffect(() => {
    if (match?.status === 'finished' && myColor && !awardedRef.current) {
      awardedRef.current = true;
      const won = (match.result === '1-0' && myColor === 'w') || (match.result === '0-1' && myColor === 'b');
      awardGameResult(won);
      const oppId = myColor === 'w' ? match.black_id : match.white_id;
      const oppName = oppId ? names[oppId] ?? 'Opponent' : 'Opponent';
      saveGame({
        mode: 'online',
        result: match.result ?? '1/2-1/2',
        pgn: match.pgn,
        white: myColor === 'w' ? 'You' : oppName,
        black: myColor === 'b' ? 'You' : oppName,
      });
    }
  }, [match?.status, match?.result, myColor, awardGameResult, names, match?.black_id, match?.white_id, match?.pgn]);

  const isMyTurn = !!match && match.status === 'active' && myColor !== null && game.turn() === myColor;

  const onSquarePress = useCallback(
    async (square: string) => {
      if (!match || !isMyTurn) return;
      const g = rebuild(match);
      if (selected) {
        let mv = null;
        try {
          mv = g.move({ from: selected, to: square, promotion: 'q' });
        } catch {
          mv = null; // illegal — fall through to reselect
        }
        if (mv) {
          setSelected(null);
          setHighlights([]);
          // Optimistic local update; the server validates and Realtime confirms.
          setMatch({ ...match, fen: g.fen(), pgn: g.pgn(), turn: g.turn() as 'w' | 'b' });
          try {
            await makeMove(match.id, mv.from, mv.to, mv.promotion);
          } catch (e: any) {
            setError(e?.message ?? 'Move rejected.');
            load(); // reconcile with authoritative state
          }
          return;
        }
      }
      if (isOwnPiece(g, square) && g.get(square as any)?.color === myColor) {
        setSelected(square);
        setHighlights(legalTargets(g, square));
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [match, isMyTurn, selected, myColor, load],
  );

  const confirm = (title: string, msg: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(`${title}\n${msg}`)) onYes();
    } else {
      Alert.alert(title, msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: onYes },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (error || !match) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={styles.err}>{error ?? 'Game not found.'}</Text>
        <View style={{ marginTop: spacing.md }}>
          <Button label="Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const flipped = myColor === 'b';
  const oppId = myColor === 'w' ? match.black_id : match.white_id;
  const oppName = oppId ? names[oppId] ?? 'Opponent' : 'Waiting for opponent…';
  const finished = match.status === 'finished';
  const drawOfferedToMe = !!match.draw_offer_by && match.draw_offer_by === oppId;

  let statusLine: string;
  if (finished) statusLine = outcome(match.result, myColor);
  else if (match.status === 'open') statusLine = 'Waiting for an opponent to join…';
  else if (myColor === null) statusLine = 'Spectating';
  else if (isMyTurn) statusLine = game.inCheck() ? 'Your move — check!' : 'Your move';
  else statusLine = `${oppName} to move…`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <Text style={styles.title}>Online game</Text>
        <View style={{ width: 40, alignItems: 'flex-end' }}>
          {match.status === 'active' && (
            <View style={styles.liveTag}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
          )}
        </View>
      </View>

      <PlayerBar name={oppName} color={flipped ? 'w' : 'b'} toMove={!isMyTurn && !finished && match.status === 'active'} />

      <View style={styles.boardWrap}>
        <ChessBoard
          fen={game.fen()}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          lastMove={lastMove}
          checkSquare={checkedKingSquare(game)}
          flipped={flipped}
        />
      </View>

      <PlayerBar name="You" color={flipped ? 'b' : 'w'} toMove={isMyTurn} />

      <View style={[styles.status, finished && styles.statusOver]}>
        <Text style={[styles.statusText, finished && { color: colors.gold }]}>{statusLine}</Text>
      </View>

      {!finished && myColor !== null && match.status === 'active' && (
        <View style={styles.actions}>
          {drawOfferedToMe ? (
            <View style={{ flex: 1 }}>
              <Button label="Accept draw" onPress={() => acceptDraw(match.id).catch((e) => setError(e.message))} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Button label="Offer draw" variant="outline" onPress={() => offerDraw(match.id).catch((e) => setError(e.message))} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Button
              label="Resign"
              variant="outline"
              onPress={() => confirm('Resign?', 'This counts as a loss.', () => resign(match.id).catch((e) => setError(e.message)))}
            />
          </View>
        </View>
      )}

      {finished && (
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Back to lobby" onPress={() => navigation.goBack()} />
          </View>
        </View>
      )}

      {error && <Text style={styles.errInline}>{error}</Text>}
    </SafeAreaView>
  );
}

function PlayerBar({ name, color, toMove }: { name: string; color: 'w' | 'b'; toMove: boolean }) {
  return (
    <View style={[styles.playerRow, toMove && styles.playerRowActive]}>
      <View style={[styles.turnDot, { backgroundColor: color === 'w' ? '#F4F1E8' : '#2B2B30' }]} />
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      {toMove && <View style={styles.toMovePip} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center' },
  err: { ...typography.body, color: colors.danger, textAlign: 'center' },
  errInline: { ...typography.muted, color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  back: { fontSize: 30, width: 40, color: colors.ink },
  title: { ...typography.h3 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  playerRowActive: { backgroundColor: colors.fill },
  turnDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.border },
  playerName: { ...typography.body, fontWeight: '600', flex: 1 },
  toMovePip: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  boardWrap: { alignItems: 'center', marginVertical: spacing.sm },
  status: { alignItems: 'center', paddingVertical: spacing.sm },
  statusOver: { backgroundColor: colors.ink, borderRadius: radius.md },
  statusText: { ...typography.body, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
