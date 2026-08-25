import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { ChessBoard } from '../components/ChessBoard';
import { colors, radius, spacing, typography } from '../theme';
import { openings } from '../data/openings';

export function OpeningsScreen() {
  return (
    <Screen>
      <AppHeader eyebrow="REFERENCE" title="Opening Book" />
      <Text style={styles.intro}>
        Named openings with their main lines and ideas. Learn the plans, not just
        the moves.
      </Text>

      <Text style={styles.label}>{openings.length} OPENINGS</Text>
      {openings.map((o) => (
        <Card key={o.eco}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{o.name}</Text>
              <Text style={styles.moves}>{o.moves.join('  ')}</Text>
            </View>
            <Pill label={o.eco} tone="default" />
          </View>
          <View style={styles.body}>
            <View style={styles.boardWrap}>
              <ChessBoard fen={o.fen} size={120} />
            </View>
            <Text style={styles.idea}>{o.idea}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs, marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  moves: { ...typography.muted, marginTop: 3, fontVariant: ['tabular-nums'] },
  body: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  boardWrap: { borderRadius: radius.sm, overflow: 'hidden' },
  idea: { ...typography.body, flex: 1, lineHeight: 21 },
});
