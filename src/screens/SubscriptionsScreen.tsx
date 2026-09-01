import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Group, Row, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { plans } from '../data/content';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Plans'>;

const PLAN_ICON: Record<string, IconName> = { basic: 'sparkles', plus: 'star', yearly: 'gift' };

export function SubscriptionsScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader eyebrow="MEMBERSHIP" title="Plans" onProfile={() => navigation.navigate('Profile')} />

      {/* Dark hero: the app is free — this is the single dark surface */}
      <Card style={styles.hero}>
        <Pill label="FREE" tone="success" />
        <Text style={styles.heroTitle}>Everything's free right now</Text>
        <Text style={styles.heroBlurb}>
          All classes, puzzles, featured broadcasts, and the game analyzer are
          unlocked during launch. Optional supporter tiers arrive later.
        </Text>
      </Card>

      <Text style={styles.label}>SUPPORTER TIERS · PREVIEW</Text>
      <Group>
        {plans.map((p, i) => (
          <Row
            key={p.id}
            first={i === 0}
            last={i === plans.length - 1}
            title={p.name}
            subtitle={p.blurb}
            left={
              <View style={[styles.iconSquare, { backgroundColor: p.color }]}>
                <Icon name={PLAN_ICON[p.id] ?? 'star'} size={18} color="#fff" />
              </View>
            }
            right={<Text style={styles.price}>${p.price}</Text>}
          />
        ))}
      </Group>

      <Text style={styles.footnote}>
        Nothing to buy today — these tiers are a preview of how you'll be able to
        support ChessMaster in the future.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, marginTop: spacing.xs },
  heroTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  heroBlurb: { ...typography.muted, color: '#C9C9CF', marginTop: spacing.xs },

  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  iconSquare: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  price: { ...typography.h3, color: colors.textMuted },

  footnote: { ...typography.muted, color: colors.textFaint, marginTop: spacing.sm, marginHorizontal: spacing.xs },
});
