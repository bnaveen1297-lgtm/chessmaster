import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, SectionHeader, Pill } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { prepPlan } from '../data/content';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Coach'>;

export function CoachScreen({ navigation }: Props) {
  return (
    <Screen>
      <Text style={typography.h1}>Prep Coach</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        More than an engine — a coach that builds your plan for the next
        tournament.
      </Text>

      <Card style={styles.hero}>
        <Pill label="YOUR EVENT" tone="gold" />
        <Text style={styles.heroTitle}>City Rapid Open</Text>
        <Text style={styles.heroMeta}>in 6 days · 5 rounds · G/25+10</Text>
        <View style={{ height: spacing.md }} />
        <Button label="Adjust goals" variant="outline" small />
      </Card>

      <Card style={styles.openingLink} onPress={() => navigation.navigate('Openings')}>
        <Text style={styles.openingGlyph}>♟️</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>Opening Book</Text>
          <Text style={typography.muted}>Build a repertoire from named ECO openings.</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Card>

      <SectionHeader title="This week's plan" />
      {prepPlan.map((p) => (
        <Card key={p.id} style={styles.dayRow}>
          <View style={styles.dayBadge}><Text style={styles.dayText}>{p.day}</Text></View>
          <Text style={[typography.body, { flex: 1 }]}>{p.focus}</Text>
        </Card>
      ))}

      <SectionHeader title="Coach can help you" />
      <Card>
        <Bullet text="Build & drill an opening repertoire that fits your style" />
        <Bullet text="Scout a specific opponent's tendencies" />
        <Bullet text="Review each round and adjust tomorrow's plan" />
        <View style={{ height: spacing.md }} />
        <Button label="Ask the coach" />
      </Card>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>♟️</Text>
      <Text style={[typography.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.dark, borderColor: colors.dark },
  heroTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  heroMeta: { ...typography.muted, color: '#B9B9C0' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayBadge: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  dayText: { ...typography.h3, color: colors.gold },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  bulletMark: { fontSize: 15 },
  openingLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  openingGlyph: { fontSize: 24 },
  chev: { fontSize: 20, color: colors.textFaint },
});
