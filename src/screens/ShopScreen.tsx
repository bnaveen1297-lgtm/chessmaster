import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Button } from '../components/ui';
import { AppHeader } from '../components/AppHeader';
import { Icon, type IconName } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
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
      <AppHeader title="Shop" onProfile={() => navigation.navigate('Profile')} />
      <Text style={[typography.muted, { marginBottom: spacing.md }]}>
        Chess boards, clocks, pieces, T-shirts and books.
      </Text>

      <View style={styles.grid}>
        {products.map((p) => (
          <View key={p.id} style={[styles.product, { backgroundColor: p.color }]}>
            <View style={styles.glyph}><Icon name={p.icon as IconName} size={40} color="#fff" /></View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.blurb}>{p.blurb}</Text>
            <View style={styles.btn}>
              <Button label="SHOP" variant="light" small />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  product: { width: '47%', borderRadius: radius.lg, padding: spacing.md, minHeight: 200, justifyContent: 'space-between' },
  glyph: { alignItems: 'center', marginVertical: spacing.md },
  name: { ...typography.h3, color: colors.onDark },
  blurb: { ...typography.muted, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  btn: { alignSelf: 'stretch', marginTop: spacing.md },
});
