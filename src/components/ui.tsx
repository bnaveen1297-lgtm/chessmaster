import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function Screen({
  children,
  scroll = true,
  dark = false,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  dark?: boolean;
  padded?: boolean;
}) {
  const bg = dark ? colors.dark : colors.bg;
  const pad = padded ? spacing.md : 0;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: pad, paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: pad }}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      {body}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.h2}>{title}</Text>
      {action ? (
        <Text style={styles.sectionAction} onPress={onAction}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  small = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'light';
  small?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isLight = variant === 'light';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        isPrimary && { backgroundColor: colors.tint },
        isLight && { backgroundColor: colors.bg },
        variant === 'outline' && styles.buttonOutline,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          small && { fontSize: 14 },
          { color: isPrimary ? colors.onDark : variant === 'outline' ? colors.tint : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Input({
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
}: {
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (t: string) => void;
}) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
    />
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** iOS grouped-list row: leading icon tile · title/subtitle · chevron. */
export function Row({
  title,
  subtitle,
  left,
  right,
  onPress,
  first,
  last,
}: {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  first?: boolean;
  last?: boolean;
}) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.row,
        first && styles.rowFirst,
        last && styles.rowLast,
        pressed && { backgroundColor: colors.fill },
      ]}
    >
      {left ? <View style={styles.rowLeft}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
    </Wrapper>
  );
}

/** Container that groups Row children into one inset iOS card. */
export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

export function Pill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'live' | 'gold' | 'success' }) {
  const map = {
    default: { bg: colors.bgAlt, fg: colors.textMuted },
    live: { bg: colors.danger, fg: colors.onDark },
    gold: { bg: colors.gold, fg: colors.ink },
    success: { bg: colors.success, fg: colors.onDark },
  } as const;
  const { bg, fg } = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {tone === 'live' && <View style={styles.liveDot} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionNumber({ n, label }: { n: string; label: string }) {
  return (
    <View style={styles.sectionNumberRow}>
      <Text style={styles.sectionNumber}>{n}</Text>
      <Text style={styles.sectionNumberLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionAction: { fontSize: 15, color: colors.tint, fontWeight: '600' },
  button: {
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.tint, backgroundColor: 'transparent' },
  buttonLabel: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.fill,
    borderRadius: radius.sm,
    padding: 2,
    marginBottom: spacing.md,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: radius.sm - 2 },
  segItemActive: { backgroundColor: colors.surface, ...shadow.card },
  segText: { fontSize: 13.5, color: colors.textMuted, fontWeight: '600' },
  segTextActive: { color: colors.ink, fontWeight: '600' },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLast: {},
  rowLeft: { alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '500', color: colors.ink, letterSpacing: -0.2 },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  sectionNumberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.xs },
  sectionNumber: { fontSize: 40, fontWeight: '800', color: colors.gold, lineHeight: 42 },
  sectionNumberLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 4, color: colors.textMuted, marginBottom: 8 },
});
