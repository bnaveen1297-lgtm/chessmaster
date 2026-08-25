import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Group, Row } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { masterGames, masterThemes, type MasterTheme } from '../data/masters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterBase'>;

export function MasterBaseScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<MasterTheme | 'All'>('All');

  const games = useMemo(
    () => (filter === 'All' ? masterGames : masterGames.filter((g) => g.themes.includes(filter))),
    [filter],
  );

  const chips: (MasterTheme | 'All')[] = ['All', ...masterThemes];

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
        <Text style={typography.display}>Master Base</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Real grandmaster games. Watch them replay, play against the master’s moves,
          or run an engine review.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}>
          {chips.map((c) => (
            <Pressable key={c} onPress={() => setFilter(c)} style={[styles.chip, filter === c && styles.chipActive]}>
              <Text style={[styles.chipText, filter === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Group>
          {games.map((g, i) => (
            <Row
              key={g.id}
              first={i === 0}
              last={i === games.length - 1}
              title={g.nickname || `${lastName(g.white)} vs ${lastName(g.black)}`}
              subtitle={`${lastName(g.white)} – ${lastName(g.black)} · ${g.event}, ${g.year}`}
              left={<View style={styles.badge}><Text style={styles.badgeText}>{g.result === '1/2-1/2' ? '½' : g.result === '1-0' ? '1–0' : '0–1'}</Text></View>}
              right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
              onPress={() => navigation.navigate('MasterGame', { id: g.id })}
            />
          ))}
          {games.length === 0 && <Row title="No games in this category yet" />}
        </Group>

        <View style={styles.note}>
          <Icon name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.noteText}>
            Every game here is a genuine, historically played game — verified move-by-move. More GM/IM games are added over time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function lastName(name: string): string {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  chipRow: { marginBottom: spacing.md },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.fill },
  chipActive: { backgroundColor: colors.ink },
  chipText: { ...typography.muted, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.onDark },
  badge: { width: 40, height: 30, borderRadius: 8, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  note: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginHorizontal: spacing.xs, alignItems: 'flex-start' },
  noteText: { ...typography.muted, flex: 1 },
});
