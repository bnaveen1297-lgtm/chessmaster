import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { colors, spacing, typography } from '../theme';

/** Top bar used across the main tab screens: avatar · title · search/bell. */
export function AppHeader({ title, onProfile }: { title: string; onProfile?: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onProfile} style={styles.avatar}>
          <Logo size={30} />
        </Pressable>
        <View style={styles.icons}>
          <Icon name="search" size={20} color={colors.textMuted} />
          <Icon name="notifications-outline" size={20} color={colors.textMuted} />
        </View>
      </View>
      <Text style={typography.h1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icons: { flexDirection: 'row', gap: spacing.md },
  icon: { fontSize: 18 },
});
