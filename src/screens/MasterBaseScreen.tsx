import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Group, Row } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { masterGames, masterThemes, type MasterTheme } from '../data/masters';
import { masterDbAvailable, fetchRandomMasterGames } from '../services/masterDb';
import type { MasterGame } from '../data/masters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterBase'>;

export function MasterBaseScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<MasterTheme | 'All'>('All');
  const hasDb = masterDbAvailable();
  const [dbGames, setDbGames] = useState<MasterGame[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  const games = useMemo(
    () => (filter === 'All' ? masterGames : masterGames.filter((g) => g.themes.includes(filter))),
    [filter],
  );
  const chips: (MasterTheme | 'All')[] = ['All', ...masterThemes];

  const shuffle = useCallback(async () => {
    setDbLoading(true);
    try {
      setDbGames(await fetchRandomMasterGames(12, 2400));
    } catch {
      setDbGames([]);
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasDb) shuffle();
  }, [hasDb, shuffle]);

  const short = (n: string) => n.split(' ').pop();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
        <Text style={typography.display}>Master Base</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Real grandmaster games. Watch them replay, play against the master’s moves,
          or run an engine review.
        </Text>

        {/* Millions of games (from the database) */}
        {hasDb && (
          <>
            <View style={styles.dbHead}>
              <Text style={styles.label}>MILLIONS OF GAMES</Text>
              <Pressable onPress={shuffle} style={styles.shuffle} hitSlop={8}>
                <Icon name="shuffle" size={15} color={colors.tint} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </Pressable>
            </View>
            {dbLoading ? (
              <ActivityIndicator color={colors.textMuted} style={{ marginVertical: spacing.md }} />
            ) : dbGames.length === 0 ? (
              <Text style={styles.dbEmpty}>No games loaded yet — import the master-games database (docs/PUZZLES.md).</Text>
            ) : (
              <Group>
                {dbGames.map((g, i) => (
                  <Row
                    key={g.id}
                    first={i === 0}
                    last={i === dbGames.length - 1}
                    title={`${short(g.white)} vs ${short(g.black)}`}
                    subtitle={`${g.opening}${g.year ? ` · ${g.year}` : ''}`}
                    left={<View style={styles.badge}><Text style={styles.badgeText}>{g.result === '1/2-1/2' ? '½' : g.result === '1-0' ? '1–0' : '0–1'}</Text></View>}
                    right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
                    onPress={() => navigation.navigate('MasterGame', { game: g })}
                  />
                ))}
              </Group>
            )}
          </>
        )}

        {/* Curated classics */}
        <Text style={styles.label}>{hasDb ? 'FEATURED CLASSICS' : 'CLASSIC GAMES'}</Text>
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
              title={g.nickname || `${short(g.white)} vs ${short(g.black)}`}
              subtitle={`${short(g.white)} – ${short(g.black)} · ${g.event}, ${g.year}`}
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
            Classics are verified move-by-move. Load the master-games database to browse millions more.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  dbHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shuffle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.lg, marginBottom: spacing.sm },
  shuffleText: { ...typography.muted, color: colors.tint, fontWeight: '700' },
  dbEmpty: { ...typography.muted, marginHorizontal: spacing.xs },
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
