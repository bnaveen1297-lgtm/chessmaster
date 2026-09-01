import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Pill } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, spacing } from '../theme';
import { liveGames } from '../data/content';
import { checkedKingSquare } from '../game/chessHelpers';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveGame'>;

/** All board positions + SAN for a PGN, precomputed so scrubbing is instant. */
function buildFrames(pgn: string) {
  const full = new Chess();
  try {
    full.loadPgn(pgn);
  } catch {
    /* leave empty */
  }
  const sans = full.history();
  const replay = new Chess();
  const frames: { fen: string; san: string | null; from?: string; to?: string; material: number }[] = [
    { fen: replay.fen(), san: null, material: 0 },
  ];
  for (const san of sans) {
    const mv = replay.move(san);
    frames.push({
      fen: replay.fen(),
      san,
      from: mv?.from,
      to: mv?.to,
      material: materialBalance(replay),
    });
  }
  return frames;
}

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
function materialBalance(g: Chess): number {
  let bal = 0;
  for (const row of g.board()) {
    for (const sq of row) {
      if (!sq) continue;
      bal += (sq.color === 'w' ? 1 : -1) * VAL[sq.type];
    }
  }
  return bal;
}

export function LiveGameScreen({ route, navigation }: Props) {
  const p = route.params;
  const game =
    p.pgn && p.white && p.black
      ? { white: p.white, black: p.black, event: p.event ?? '', result: p.result ?? '', pgn: p.pgn }
      : liveGames.find((g) => g.id === p.id) ?? liveGames[0];
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 340);

  const frames = useMemo(() => buildFrames(game.pgn), [game.pgn]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    clear();
    if (playing && idx < frames.length - 1) {
      timer.current = setTimeout(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), 1100);
    } else if (idx >= frames.length - 1) {
      setPlaying(false);
    }
    return clear;
  }, [playing, idx, frames.length]);

  const go = useCallback(
    (n: number) => {
      setPlaying(false);
      setIdx((i) => Math.max(0, Math.min(frames.length - 1, i + n)));
    },
    [frames.length],
  );

  const frame = frames[idx];
  const board = useMemo(() => {
    const g = new Chess();
    try {
      g.load(frame.fen);
    } catch {
      /* ignore */
    }
    return g;
  }, [frame.fen]);

  const finished = idx >= frames.length - 1;
  const moveNo = Math.ceil(idx / 2);
  const totalMoves = Math.ceil((frames.length - 1) / 2);
  const bal = frame.material;
  const evalStr = bal === 0 ? '=' : `${bal > 0 ? '+' : '−'}${Math.abs(bal)}`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <View style={styles.players}>
          <Player name={game.white} white />
          <Text style={styles.vs}>vs</Text>
          <Player name={game.black} white={false} />
        </View>
        <Pill label="FEATURED" tone="gold" />
      </View>

      <Text style={styles.event}>{game.event}</Text>

      <View style={styles.boardWrap}>
        <ChessBoard
          fen={frame.fen}
          size={boardSize}
          lastMove={frame.from && frame.to ? { from: frame.from, to: frame.to } : null}
          checkSquare={checkedKingSquare(board)}
          showCoords
        />
      </View>

      <View style={styles.info}>
        <View style={styles.evalRow}>
          <Text style={styles.eval}>Material {evalStr}</Text>
          <Text style={styles.moveCount}>
            {finished ? `Final · ${game.result}` : `Move ${moveNo}/${totalMoves}`}
          </Text>
        </View>
        <Text style={styles.san}>
          {frame.san ? `${idx % 2 === 1 ? Math.ceil(idx / 2) + '.' : Math.ceil(idx / 2) + '…'} ${frame.san}` : 'Starting position'}
        </Text>
      </View>

      {/* playback controls (all functional) */}
      <View style={styles.controls}>
        <Ctrl icon="play-skip-back" onPress={() => { setPlaying(false); setIdx(0); }} />
        <Ctrl icon="play-back" onPress={() => go(-1)} />
        <Ctrl
          icon={playing ? 'pause' : 'play'}
          primary
          onPress={() => {
            if (finished) setIdx(0);
            setPlaying((p) => !p);
          }}
        />
        <Ctrl icon="play-forward" onPress={() => go(1)} />
        <Ctrl icon="play-skip-forward" onPress={() => { setPlaying(false); setIdx(frames.length - 1); }} />
      </View>
    </SafeAreaView>
  );
}

function Ctrl({ icon, onPress, primary }: { icon: IconName; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ctrl, primary && styles.ctrlPrimary, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={primary ? 26 : 20} color={colors.onDark} />
    </Pressable>
  );
}

function Player({ name, white }: { name: string; white: boolean }) {
  return (
    <View style={styles.player}>
      <View style={[styles.playerAvatar, { backgroundColor: white ? '#F4F1E8' : '#2B2B30', borderColor: white ? '#D8D3C4' : '#111' }]} />
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark, padding: spacing.md, justifyContent: 'space-between' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.onDark, fontSize: 30, width: 32 },
  players: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, justifyContent: 'center' },
  vs: { color: colors.textFaint, fontSize: 12 },
  player: { alignItems: 'center', maxWidth: 110 },
  playerAvatar: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, marginBottom: 2 },
  playerName: { color: colors.onDark, fontSize: 11, fontWeight: '600' },
  event: { color: colors.textFaint, textAlign: 'center', fontSize: 12.5, marginTop: 4 },
  boardWrap: { alignItems: 'center' },
  info: { alignItems: 'center', gap: 6 },
  evalRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  eval: { color: colors.gold, fontWeight: '700' },
  moveCount: { color: '#C9C9CF', fontWeight: '600' },
  san: { color: colors.onDark, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  controls: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.darkAlt, borderRadius: radius.pill, padding: spacing.sm,
  },
  ctrl: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  ctrlPrimary: { backgroundColor: colors.tint },
});
