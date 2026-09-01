import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { colors, spacing, typography } from '../theme';

/**
 * iOS-style navigation header: a small eyebrow row (avatar · actions) above a
 * large title, matching the large-title behaviour at the top of Apple apps.
 */
export function AppHeader({
  title,
  eyebrow,
  onProfile,
}: {
  title: string;
  eyebrow?: string;
  onProfile?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onProfile} style={styles.avatar} hitSlop={8}>
          <Logo size={30} />
        </Pressable>
        <View style={styles.icons}>
          <Icon name="search" size={20} color={colors.textMuted} />
          <Icon name="notifications-outline" size={20} color={colors.textMuted} />
        </View>
      </View>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icons: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  eyebrow: { ...typography.label, color: colors.textMuted, marginBottom: 2 },
  title: { ...typography.display },
});
