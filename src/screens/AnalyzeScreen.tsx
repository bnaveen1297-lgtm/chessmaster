import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { Screen, Card, Button } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { analyzeGame, SAMPLE_PGN, type GameReport, type MoveClass, type SideReport } from '../engine/analyze';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyze'>;

// Distinct colors per label (Chess.com-like palette, mapped to our theme).
const CLASS_COLOR: Record<MoveClass, string> = {
  Brilliant: colors.teal,
  Great: colors.info,
  Best: colors.success,
  Good: colors.textMuted,
  Book: colors.textFaint,
  Inaccuracy: colors.warning,
  Mistake: colors.orange,
  Miss: colors.purple,
  Blunder: colors.danger,
};

// Labels that represent a loss worth showing a centipawn drop + engine line for.
const LOSS_CLASSES = new Set<MoveClass>(['Inaccuracy', 'Mistake', 'Miss', 'Blunder']);

/** Color the accuracy number by quality. */
function accuracyColor(pct: number): string {
  if (pct >= 90) return colors.success;
  if (pct >= 80) return colors.info;
  if (pct >= 60) return colors.warning;
  return colors.danger;
}

export function AnalyzeScreen({ route, navigation }: Props) {
  const incoming = route.params?.pgn;
  const [pgn, setPgn] = useState(incoming || SAMPLE_PGN);
  const [report, setReport] = useState<GameReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback((text: string) => {
    setError(null);
    setReport(null);
    setBusy(true);
    // Defer so the spinner paints before the (blocking) analysis runs.
    setTimeout(() => {
      try {
        setReport(analyzeGame(text, 2));
      } catch (e: any) {
        setError(e?.message ? `Couldn't read that PGN: ${e.message}` : "Couldn't read that PGN.");
      } finally {
        setBusy(false);
      }
    }, 60);
  }, []);

  const run = useCallback(() => analyze(pgn), [analyze, pgn]);

  // If we arrived with a game to review (e.g. from the Master Base), run it.
  useEffect(() => {
    if (incoming) analyze(incoming);
  }, [incoming, analyze]);

  return (
    <Screen>
      <AppHeader eyebrow="ANALYZE" title="Game Report" />
      <Text style={styles.intro}>
        Paste a PGN and get an engine review — accuracy, blunders, and every move rated.
      </Text>

      <Card style={styles.importCard} onPress={() => navigation.navigate('ImportGames')}>
        <View style={styles.importGlyph}><Icon name="cloud-download" size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.importTitle}>Import from Chess.com or Lichess</Text>
          <Text style={styles.importSub}>Pull your recent games by username</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      </Card>

      <Text style={styles.label}>YOUR GAME</Text>
      <Card>
        <TextInput
          style={styles.pgn}
          value={pgn}
          onChangeText={setPgn}
          multiline
          placeholder="Paste PGN here…"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Button label={busy ? 'Analyzing…' : 'Analyze game'} onPress={run} /></View>
          <View style={{ flex: 1 }}><Button label="Load sample" variant="outline" onPress={() => { setPgn(SAMPLE_PGN); setReport(null); setError(null); }} /></View>
        </View>
      </Card>

      {busy && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
          <Text style={typography.muted}>Running engine review…</Text>
        </View>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Icon name="alert-circle" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {report && !busy && (
        <View>
          <Text style={styles.label}>REPORT</Text>

          <Card style={styles.openingCard}>
            <View style={styles.openingGlyph}><Icon name="book" size={16} color={colors.tint} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.openingLabel}>OPENING</Text>
              <Text style={styles.openingName}>{report.openingName}</Text>
            </View>
            <Text style={styles.resultText}>{report.result === '*' ? '' : report.result}</Text>
          </Card>

          <View style={styles.statRow}>
            <SideCard title="White" side={report.white} />
            <SideCard title="Black" side={report.black} />
          </View>

          <Text style={styles.label}>EVALUATION</Text>
          <Card>
            <EvalGraph series={report.evalSeries} />
            <View style={styles.evalLegend}>
              <Text style={styles.evalLegendText}>White</Text>
              <Text style={styles.evalLegendText}>Black</Text>
            </View>
          </Card>

          <Text style={styles.label}>MOVE BY MOVE</Text>
          <Card style={styles.moveCard}>
            {report.moves.map((m, i) => {
              const showLoss = LOSS_CLASSES.has(m.classification);
              const tagColor = CLASS_COLOR[m.classification];
              return (
                <View key={m.ply} style={[styles.moveBlock, i > 0 && styles.moveDivider]}>
                  <View style={styles.moveRow}>
                    <Text style={styles.moveNo}>{m.color === 'w' ? `${m.moveNo}.` : `${m.moveNo}…`}</Text>
                    <Text style={styles.moveSan}>{m.san}</Text>
                    <View style={[styles.tag, { backgroundColor: tagColor + '22' }]}>
                      <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                      <Text style={[styles.tagText, { color: tagColor }]}>{m.classification}</Text>
                    </View>
                    {showLoss && m.cpLoss > 0 && <Text style={styles.cp}>−{(m.cpLoss / 100).toFixed(1)}</Text>}
                  </View>
                  {showLoss && m.bestSan !== m.san && (
                    <Text style={styles.bestLine}>engine preferred <Text style={styles.bestSan}>{m.bestSan}</Text></Text>
                  )}
                </View>
              );
            })}
          </Card>
          <Text style={styles.footnote}>
            Win% and accuracy use the Lichess/Chess.com model; centipawn loss is
            vs. the engine's best move. Depth-2 quick review — a deeper Stockfish
            pass comes with the backend.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function SideCard({ title, side }: { title: string; side: SideReport }) {
  return (
    <Card style={styles.sideCard}>
      <Text style={styles.sideLabel}>{title.toUpperCase()}</Text>
      <Text style={[styles.accuracy, { color: accuracyColor(side.accuracy) }]}>{side.accuracy}%</Text>
      <Text style={styles.sideMeta}>accuracy · {side.acpl} acpl</Text>
      <View style={styles.countRow}>
        <Count n={side.blunder} label="Blunders" color={colors.danger} />
        <Count n={side.mistake} label="Mistakes" color={colors.orange} />
        <Count n={side.inaccuracy} label="Inacc." color={colors.warning} />
      </View>
    </Card>
  );
}

/**
 * A small self-contained area chart of White's win% across the game.
 * Above the 50% midline favors White; below favors Black.
 */
function EvalGraph({ series }: { series: number[] }) {
  const [width, setWidth] = useState(0);
  const height = 96;
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const n = series.length;
  const x = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * width);
  const y = (pct: number) => height - (pct / 100) * height; // 100% (White) at top

  let linePath = '';
  let areaPath = '';
  if (width > 0 && n > 0) {
    const pts = series.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`);
    linePath = 'M' + pts.join(' L');
    areaPath = `M${x(0).toFixed(1)},${height} L` + pts.join(' L') + ` L${x(n - 1).toFixed(1)},${height} Z`;
  }
  const mid = y(50);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && n > 0 && (
        <Svg width={width} height={height}>
          {areaPath ? <Path d={areaPath} fill={colors.tint} fillOpacity={0.12} /> : null}
          <Line x1={0} y1={mid} x2={width} y2={mid} stroke={colors.border} strokeWidth={1} strokeDasharray="4 4" />
          {linePath ? <Path d={linePath} stroke={colors.tint} strokeWidth={2} fill="none" /> : null}
        </Svg>
      )}
    </View>
  );
}

function Count({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={styles.count}>
      <Text style={[styles.countN, { color }]}>{n}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs, marginBottom: spacing.sm },
  importCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface },
  importGlyph: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1F9E7A', alignItems: 'center', justifyContent: 'center' },
  importTitle: { ...typography.h3, fontSize: 15 },
  importSub: { ...typography.muted, fontSize: 12.5 },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  pgn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.bg,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  errorText: { color: colors.danger, fontWeight: '600', flex: 1 },
  openingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  openingGlyph: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.tint + '18', alignItems: 'center', justifyContent: 'center' },
  openingLabel: { ...typography.label, color: colors.textFaint },
  openingName: { ...typography.h3, fontSize: 16 },
  resultText: { ...typography.h3, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  evalLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  evalLegendText: { ...typography.label, color: colors.textFaint },
  statRow: { flexDirection: 'row', gap: spacing.md },
  sideCard: { flex: 1 },
  sideLabel: { ...typography.label, color: colors.textMuted },
  accuracy: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  sideMeta: { ...typography.muted, fontSize: 12.5 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  count: { alignItems: 'center' },
  countN: { fontSize: 18, fontWeight: '800' },
  countLabel: { fontSize: 10, color: colors.textFaint, fontWeight: '600', marginTop: 1 },
  moveCard: { paddingVertical: spacing.xs },
  moveBlock: { paddingVertical: 4 },
  moveDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  moveNo: { ...typography.muted, width: 38, fontVariant: ['tabular-nums'] },
  moveSan: { ...typography.body, fontWeight: '700', flex: 1 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  cp: { ...typography.muted, width: 44, textAlign: 'right', color: colors.danger, fontVariant: ['tabular-nums'] },
  bestLine: { ...typography.muted, fontSize: 11, marginLeft: 46, marginTop: -2, marginBottom: 4 },
  bestSan: { color: colors.success, fontWeight: '700' },
  footnote: { ...typography.muted, marginTop: spacing.md, marginLeft: spacing.xs },
});
