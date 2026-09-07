import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button, Segmented } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { legalTargets, isOwnPiece, checkedKingSquare } from '../game/chessHelpers';
import { openings } from '../data/openings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OpeningTrainer'>;

/** Board positions + verbose moves for a SAN line, computed once. */
function buildFrames(moves: string[]) {
  const g = new Chess();
  const frames: { fen: string; san: string | null; from?: string; to?: string }[] = [
    { fen: g.fen(), san: null },
  ];
  for (const san of moves) {
    const mv = g.move(san);
    frames.push({ fen: g.fen(), san: mv?.san ?? san, from: mv?.from, to: mv?.to });
  }
  return frames;
}

export function OpeningTrainerScreen({ route, navigation }: Props) {
  const opening = openings.find((o) => o.eco === route.params.eco) ?? openings[0];
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 360);
  const frames = useMemo(() => buildFrames(opening.moves), [opening.moves]);

  const [mode, setMode] = useState('Study');

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title} numberOfLines={1}>{opening.name}</Text>
          <Text style={styles.subtitle}>{opening.eco}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.segWrap}>
        <Segmented options={['Study', 'Practice']} value={mode} onChange={setMode} />
      </View>

      {mode === 'Study' ? (
        <StudyMode frames={frames} boardSize={boardSize} idea={opening.idea} />
      ) : (
        <PracticeMode opening={opening} boardSize={boardSize} />
      )}
    </SafeAreaView>
  );
}

function StudyMode({
  frames,
  boardSize,
  idea,
}: {
  frames: ReturnType<typeof buildFrames>;
  boardSize: number;
  idea: string;
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (playing && idx < frames.length - 1) {
      timer.current = setTimeout(() => setIdx((i) => Math.min(i + 1, frames.length - 1)), 900);
    } else if (idx >= frames.length - 1) {
      setPlaying(false);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, idx, frames.length]);

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
  const atEnd = idx >= frames.length - 1;

  const step = (n: number) => {
    setPlaying(false);
    setIdx((i) => Math.max(0, Math.min(frames.length - 1, i + n)));
  };

  return (
    <View style={styles.body}>
      <View style={styles.boardWrap}>
        <ChessBoard
          fen={frame.fen}
          size={boardSize}
          lastMove={frame.from && frame.to ? { from: frame.from, to: frame.to } : null}
          checkSquare={checkedKingSquare(board)}
          showCoords
        />
      </View>

      <Text style={styles.moveLine}>
        {frame.san ? `${idx % 2 === 1 ? Math.ceil(idx / 2) + '.' : Math.ceil(idx / 2) + '…'} ${frame.san}` : 'Starting position'}
        {atEnd ? '  ·  end of line' : ''}
      </Text>
      <Text style={styles.idea}>{idea}</Text>

      <View style={styles.controls}>
        <Ctrl icon="play-skip-back" onPress={() => { setPlaying(false); setIdx(0); }} />
        <Ctrl icon="play-back" onPress={() => step(-1)} />
        <Ctrl icon={playing ? 'pause' : 'play'} primary onPress={() => { if (atEnd) setIdx(0); setPlaying((p) => !p); }} />
        <Ctrl icon="play-forward" onPress={() => step(1)} />
        <Ctrl icon="play-skip-forward" onPress={() => { setPlaying(false); setIdx(frames.length - 1); }} />
      </View>
    </View>
  );
}

function PracticeMode({ opening, boardSize }: { opening: (typeof openings)[number]; boardSize: number }) {
  const gameRef = useRef<Chess | null>(null);
  if (gameRef.current === null) gameRef.current = new Chess();

  const [fen, setFen] = useState(gameRef.current.fen());
  const [ply, setPly] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const done = ply >= opening.moves.length;

  const reset = useCallback(() => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setPly(0);
    setSelected(null);
    setHighlights([]);
    setWrong(false);
  }, []);

  const onSquarePress = useCallback(
    (square: string) => {
      const g = gameRef.current;
      if (!g || done) return;
      if (selected) {
        // Determine the expected move (as verbose) by trying it on a clone.
        const expected = opening.moves[ply];
        const clone = new Chess(g.fen());
        let expMv: { from: string; to: string } | null = null;
        try {
          const m = clone.move(expected);
          expMv = m ? { from: m.from, to: m.to } : null;
        } catch {
          expMv = null;
        }
        if (expMv && selected === expMv.from && square === expMv.to) {
          g.move(expected);
          setFen(g.fen());
          setPly((p) => p + 1);
          setSelected(null);
          setHighlights([]);
          setWrong(false);
          return;
        }
        if (legalTargets(g, selected).includes(square)) {
          setSelected(null);
          setHighlights([]);
          setWrong(true);
          return;
        }
      }
      if (isOwnPiece(g, square)) {
        setSelected(square);
        setHighlights(legalTargets(g, square));
        setWrong(false);
      } else {
        setSelected(null);
        setHighlights([]);
      }
    },
    [selected, ply, done, opening.moves],
  );

  const nextLabel = !done ? `Play move ${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? '.' : '…'}  (${ply % 2 === 0 ? 'White' : 'Black'})` : '';

  return (
    <View style={styles.body}>
      <View style={styles.boardWrap}>
        <ChessBoard
          fen={fen}
          size={boardSize}
          onSquarePress={onSquarePress}
          selected={selected}
          highlights={highlights}
          checkSquare={gameRef.current ? checkedKingSquare(gameRef.current) : null}
          showCoords
        />
      </View>

      {done ? (
        <View style={[styles.practiceMsg, styles.practiceDone]}>
          <Icon name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.practiceText}>Line complete — you played the whole {opening.name}.</Text>
        </View>
      ) : wrong ? (
        <View style={[styles.practiceMsg, styles.practiceWrong]}>
          <Icon name="close-circle" size={20} color={colors.danger} />
          <Text style={styles.practiceText}>That’s not the book move here. {nextLabel}.</Text>
        </View>
      ) : (
        <Text style={styles.practicePrompt}>{nextLabel} to move it on the board.</Text>
      )}

      <View style={styles.controls}>
        <View style={{ flex: 1 }}><Button label="Restart" onPress={reset} /></View>
      </View>
    </View>
  );
}

function Ctrl({ icon, onPress, primary }: { icon: IconName; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ctrl, primary && styles.ctrlPrimary, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={primary ? 24 : 20} color={primary ? '#fff' : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { fontSize: 30, width: 32, color: colors.ink },
  title: { ...typography.h3 },
  subtitle: { ...typography.muted, fontSize: 12 },
  segWrap: { marginTop: spacing.sm },
  body: { flex: 1 },
  boardWrap: { alignItems: 'center', marginVertical: spacing.xs },
  moveLine: { ...typography.h3, textAlign: 'center', marginTop: spacing.xs },
  idea: { ...typography.muted, textAlign: 'center', marginTop: 4, marginHorizontal: spacing.md, lineHeight: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  ctrl: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface, flex: 1 },
  ctrlPrimary: { backgroundColor: colors.tint },
  practicePrompt: { ...typography.body, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
  practiceMsg: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  practiceDone: { backgroundColor: 'rgba(46,158,107,0.10)' },
  practiceWrong: { backgroundColor: 'rgba(211,82,75,0.10)' },
  practiceText: { ...typography.body, fontSize: 14, flex: 1 },
});
