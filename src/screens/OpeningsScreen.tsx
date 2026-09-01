import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { ChessBoard } from '../components/ChessBoard';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { openings } from '../data/openings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Openings'>;

export function OpeningsScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader eyebrow="REFERENCE" title="Opening Book" />
      <Text style={styles.intro}>
        Named openings with their main lines and ideas. Tap one to step through it
        or practise the line move by move.
      </Text>

      <Text style={styles.label}>{openings.length} OPENINGS</Text>
      {openings.map((o) => (
        <Card key={o.eco} onPress={() => navigation.navigate('OpeningTrainer', { eco: o.eco })}>
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
          <View style={styles.cta}>
            <Icon name="play-circle" size={15} color={colors.tint} />
            <Text style={styles.ctaText}>Study & practise</Text>
            <Icon name="chevron-forward" size={16} color={colors.textFaint} />
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
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  ctaText: { ...typography.muted, color: colors.tint, fontWeight: '600', flex: 1 },
});
