import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Button, Group, Row, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { prepPlan } from '../data/content';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Coach'>;

export function CoachScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader eyebrow="PREP" title="Prep Coach" onProfile={() => navigation.navigate('Profile')} />
      <Text style={styles.intro}>
        More than an engine — a coach that builds your plan for the next
        tournament.
      </Text>

      {/* Dark hero: your next event (the single dark surface) */}
      <Card style={styles.hero}>
        <Pill label="YOUR EVENT" tone="gold" />
        <Text style={styles.heroTitle}>City Rapid Open</Text>
        <Text style={styles.heroMeta}>in 6 days · 5 rounds · G/25+10</Text>
        <View style={{ height: spacing.md }} />
        <Button label="Adjust goals" variant="outline" small />
      </Card>

      <Text style={styles.label}>REFERENCE</Text>
      <Group>
        <Row
          first
          last
          title="Opening Book"
          subtitle="Build a repertoire from named ECO openings."
          onPress={() => navigation.navigate('Openings')}
          left={
            <View style={[styles.iconSquare, { backgroundColor: colors.tint }]}>
              <Icon name="library" size={18} color="#fff" />
            </View>
          }
          right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
        />
      </Group>

      <Text style={styles.label}>THIS WEEK'S PLAN</Text>
      <Group>
        {prepPlan.map((p, i) => (
          <Row
            key={p.id}
            first={i === 0}
            last={i === prepPlan.length - 1}
            title={p.focus}
            left={
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{p.day}</Text>
              </View>
            }
          />
        ))}
      </Group>

      <Text style={styles.label}>COACH CAN HELP YOU</Text>
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
      <View style={styles.bulletMark}>
        <Icon name="checkmark" size={13} color={colors.tint} />
      </View>
      <Text style={[typography.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs, marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },

  hero: { backgroundColor: colors.ink, marginTop: spacing.xs },
  heroTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  heroMeta: { ...typography.muted, color: '#B9B9C0', marginTop: 2 },

  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '700', color: colors.tint, letterSpacing: -0.2 },

  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  bulletMark: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.fill,
    alignItems: 'center', justifyContent: 'center',
  },
});
