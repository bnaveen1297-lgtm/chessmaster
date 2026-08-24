import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, SectionHeader } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { analysisFindings, recurringMistakes } from '../data/content';

export function AnalyzeScreen() {
  return (
    <Screen>
      <Text style={typography.h1}>Analyze your games</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        Bring your own games. Our analyzer finds your patterns and turns them
        into practice.
      </Text>

      <SectionHeader title="Import from" />
      <View style={styles.importRow}>
        <ImportOption label="Chess.com" hint="by username" />
        <ImportOption label="Lichess" hint="by username" />
        <ImportOption label="Upload PGN" hint="file / paste" />
      </View>

      <SectionHeader title="Last analysis" action="View report" />
      <View style={styles.statRow}>
        {analysisFindings.map((f) => (
          <Card key={f.id} style={styles.statCard}>
            <Text style={[styles.statValue, { color: f.color }]}>{f.value}</Text>
            <Text style={typography.label}>{f.label.toUpperCase()}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={typography.h3}>Your recurring mistakes</Text>
        {recurringMistakes.map((m, i) => (
          <View key={i} style={styles.mistake}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[typography.body, { flex: 1 }]}>{m}</Text>
          </View>
        ))}
        <View style={{ height: spacing.md }} />
        <Button label="Generate drills from these" />
      </Card>
    </Screen>
  );
}

function ImportOption({ label, hint }: { label: string; hint: string }) {
  return (
    <Card style={styles.importCard}>
      <Text style={styles.importLabel}>{label}</Text>
      <Text style={typography.label}>{hint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  importRow: { flexDirection: 'row', gap: spacing.sm },
  importCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  importLabel: { ...typography.h3, fontSize: 14, marginBottom: 2, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800' },
  mistake: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  bullet: { color: colors.gold, fontSize: 16, lineHeight: 20 },
});
