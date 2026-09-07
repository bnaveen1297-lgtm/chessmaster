import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Button } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { products } from '../data/content';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/RootNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Shop'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ShopScreen({ navigation }: Props) {
  return (
    <Screen>
      <AppHeader eyebrow="STORE" title="Shop" onProfile={() => navigation.navigate('Profile')} />

      <Text style={styles.intro}>Boards, clocks, pieces, tees and books.</Text>

      <Text style={styles.label}>FEATURED GEAR</Text>
      <View style={styles.grid}>
        {products.map((p) => (
          <View key={p.id} style={styles.tile}>
            <View style={[styles.iconSquare, { backgroundColor: p.color }]}>
              <Icon name={p.icon as IconName} size={22} color="#fff" />
            </View>
            <View style={styles.tileBody}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.blurb}>{p.blurb}</Text>
            </View>
            <Button label="Shop" variant="outline" small />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.muted, marginLeft: spacing.xs, marginBottom: spacing.xs },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 190,
    ...shadow.card,
  },
  iconSquare: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileBody: { flex: 1, marginTop: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  blurb: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
});
