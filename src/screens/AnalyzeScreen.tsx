import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Screen, Card, Button, SectionHeader } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { analyzeGame, SAMPLE_PGN, type GameReport, type MoveClass, type SideReport } from '../engine/analyze';

const CLASS_COLOR: Record<MoveClass, string> = {
  Best: colors.success,
  Good: colors.textMuted,
  Inaccuracy: colors.warning,
  Mistake: colors.orange,
  Blunder: colors.danger,
};

export function AnalyzeScreen() {
  const [pgn, setPgn] = useState(SAMPLE_PGN);
  const [report, setReport] = useState<GameReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setError(null);
    setReport(null);
    setBusy(true);
    // Defer so the spinner paints before the (blocking) analysis runs.
    setTimeout(() => {
      try {
        setReport(analyzeGame(pgn, 2));
      } catch (e: any) {
        setError(e?.message ? `Couldn't read that PGN: ${e.message}` : "Couldn't read that PGN.");
      } finally {
        setBusy(false);
      }
    }, 60);
  }, [pgn]);

  return (
    <Screen>
      <Text style={typography.h1}>Analyze your games</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        Paste a PGN and get an engine review — accuracy, blunders, and every
        move rated. (Chess.com / Lichess username import arrives with the backend.)
      </Text>

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

      {busy && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
          <Text style={typography.muted}>Running engine review…</Text>
        </View>
      )}

      {error && (
        <Card style={{ borderColor: colors.danger }}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text>
        </Card>
      )}

      {report && !busy && (
        <View>
          <SectionHeader title="Report" />
          <View style={styles.statRow}>
            <SideCard title="White" side={report.white} />
            <SideCard title="Black" side={report.black} />
          </View>

          <SectionHeader title="Move by move" />
          <Card>
            {report.moves.map((m) => {
              const show = m.classification !== 'Best' && m.classification !== 'Good';
              return (
                <View key={m.ply} style={styles.moveRow}>
                  <Text style={styles.moveNo}>{m.color === 'w' ? `${m.moveNo}.` : `${m.moveNo}…`}</Text>
                  <Text style={styles.moveSan}>{m.san}</Text>
                  <View style={[styles.tag, { backgroundColor: CLASS_COLOR[m.classification] + '22' }]}>
                    <View style={[styles.tagDot, { backgroundColor: CLASS_COLOR[m.classification] }]} />
                    <Text style={[styles.tagText, { color: CLASS_COLOR[m.classification] }]}>{m.classification}</Text>
                  </View>
                  {show && m.cpLoss > 0 && <Text style={styles.cp}>−{(m.cpLoss / 100).toFixed(1)}</Text>}
                </View>
              );
            })}
          </Card>
          <Text style={styles.footnote}>
            Centipawn loss vs. the engine's best move. Depth-2 quick review — a
            deeper Stockfish pass comes with the backend.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function SideCard({ title, side }: { title: string; side: SideReport }) {
  return (
    <Card style={styles.sideCard}>
      <Text style={typography.label}>{title.toUpperCase()}</Text>
      <Text style={styles.accuracy}>{side.accuracy}%</Text>
      <Text style={typography.muted}>accuracy · {side.acpl} acpl</Text>
      <View style={styles.countRow}>
        <Count n={side.blunder} label="Blunders" color={colors.danger} />
        <Count n={side.mistake} label="Mistakes" color={colors.orange} />
        <Count n={side.inaccuracy} label="Inacc." color={colors.warning} />
      </View>
    </Card>
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
  pgn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.bgAlt,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  sideCard: { flex: 1 },
  accuracy: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 2 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  count: { alignItems: 'center' },
  countN: { fontSize: 18, fontWeight: '800' },
  countLabel: { fontSize: 10, color: colors.textFaint, fontWeight: '600' },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  moveNo: { ...typography.muted, width: 38, fontVariant: ['tabular-nums'] },
  moveSan: { ...typography.body, fontWeight: '700', flex: 1 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
  cp: { ...typography.muted, width: 44, textAlign: 'right', color: colors.danger, fontVariant: ['tabular-nums'] },
  footnote: { ...typography.muted, marginTop: spacing.md },
});
