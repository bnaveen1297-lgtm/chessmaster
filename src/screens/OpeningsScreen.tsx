import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { ChessBoard } from '../components/ChessBoard';
import { spacing, typography } from '../theme';
import { openings } from '../data/openings';

export function OpeningsScreen() {
  return (
    <Screen>
      <Text style={typography.h1}>Opening Book</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        Named openings with their main lines and ideas. Learn the plans, not just
        the moves.
      </Text>

      {openings.map((o) => (
        <Card key={o.eco}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{o.name}</Text>
              <Text style={styles.moves}>{o.moves.join('  ')}</Text>
            </View>
            <Pill label={o.eco} tone="gold" />
          </View>
          <View style={styles.body}>
            <ChessBoard fen={o.fen} size={120} />
            <Text style={styles.idea}>{o.idea}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  moves: { ...typography.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  body: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  idea: { ...typography.body, flex: 1, lineHeight: 21 },
});
