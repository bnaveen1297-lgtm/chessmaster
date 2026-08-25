import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Screen, Card, Button } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { analyzeGame, SAMPLE_PGN, type GameReport, type MoveClass, type SideReport } from '../engine/analyze';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyze'>;

const CLASS_COLOR: Record<MoveClass, string> = {
  Best: colors.success,
  Good: colors.textMuted,
  Inaccuracy: colors.warning,
  Mistake: colors.orange,
  Blunder: colors.danger,
};

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
          <View style={styles.statRow}>
            <SideCard title="White" side={report.white} />
            <SideCard title="Black" side={report.black} />
          </View>

          <Text style={styles.label}>MOVE BY MOVE</Text>
          <Card style={styles.moveCard}>
            {report.moves.map((m, i) => {
              const show = m.classification !== 'Best' && m.classification !== 'Good';
              return (
                <View key={m.ply} style={[styles.moveBlock, i > 0 && styles.moveDivider]}>
                  <View style={styles.moveRow}>
                    <Text style={styles.moveNo}>{m.color === 'w' ? `${m.moveNo}.` : `${m.moveNo}…`}</Text>
                    <Text style={styles.moveSan}>{m.san}</Text>
                    <View style={[styles.tag, { backgroundColor: CLASS_COLOR[m.classification] + '22' }]}>
                      <View style={[styles.tagDot, { backgroundColor: CLASS_COLOR[m.classification] }]} />
                      <Text style={[styles.tagText, { color: CLASS_COLOR[m.classification] }]}>{m.classification}</Text>
                    </View>
                    {show && m.cpLoss > 0 && <Text style={styles.cp}>−{(m.cpLoss / 100).toFixed(1)}</Text>}
                  </View>
                  {show && m.bestSan !== m.san && (
                    <Text style={styles.bestLine}>engine preferred <Text style={styles.bestSan}>{m.bestSan}</Text></Text>
                  )}
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
      <Text style={styles.sideLabel}>{title.toUpperCase()}</Text>
      <Text style={styles.accuracy}>{side.accuracy}%</Text>
      <Text style={styles.sideMeta}>accuracy · {side.acpl} acpl</Text>
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
