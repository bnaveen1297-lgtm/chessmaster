import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen, Card, Button, Pill } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { colors, radius, spacing, typography } from '../theme';
import { plans } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Plans'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function SubscriptionsScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader title="Subscription" onProfile={() => navigation.navigate('Profile')} />

      {/* Free-to-use now (pricing revisited later) */}
      <Card style={styles.freeBanner}>
        <Pill label="LAUNCH" tone="gold" />
        <Text style={styles.freeTitle}>Everything's free right now 🎉</Text>
        <Text style={styles.freeBlurb}>
          All classes, puzzles, Olympiad live, and the game analyzer are unlocked
          during launch. Paid plans arrive later.
        </Text>
      </Card>

      <Text style={[typography.h3, { marginTop: spacing.md }]}>Plans (coming later)</Text>
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        A preview of the membership tiers we're considering.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {plans.map((p) => (
          <View key={p.id} style={[styles.plan, { backgroundColor: p.color }]}>
            <Text style={styles.planName}>{p.name}</Text>
            <Text style={styles.planPrice}>{p.price}$</Text>
            <Text style={styles.planBlurb}>{p.blurb}</Text>
            <View style={styles.planBtn}>
              <Button label="Included free" variant="light" small />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  freeBanner: { backgroundColor: colors.ink, borderColor: colors.ink, marginTop: spacing.sm },
  freeTitle: { ...typography.h2, color: colors.onDark, marginTop: spacing.sm },
  freeBlurb: { ...typography.muted, color: '#C9C9CF', marginTop: spacing.xs },
  plan: { width: 210, borderRadius: radius.lg, padding: spacing.md, minHeight: 220 },
  planName: { ...typography.h3, color: colors.onDark },
  planPrice: { fontSize: 34, fontWeight: '800', color: colors.onDark, marginVertical: spacing.sm },
  planBlurb: { ...typography.muted, color: 'rgba(255,255,255,0.9)', flex: 1 },
  planBtn: { alignSelf: 'flex-start', marginTop: spacing.md },
});
