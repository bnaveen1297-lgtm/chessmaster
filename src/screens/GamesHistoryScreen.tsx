import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Group, Row, Card, Button } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { listGames, clearGames, modeLabel, type GameRecord } from '../game/history';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GamesHistory'>;

const MODE_ICON: Record<string, IconName> = {
  computer: 'hardware-chip',
  friend: 'people',
  master: 'ribbon',
  online: 'globe',
};

function resultTone(r: string): { label: string; color: string } {
  if (r === '1/2-1/2') return { label: 'Draw', color: colors.textMuted };
  return { label: r, color: colors.ink };
}

function when(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function GamesHistoryScreen({ navigation }: Props) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setGames(await listGames());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.textMuted} />}
      >
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
        <Text style={typography.display}>Your games</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Every finished game is saved here. Tap one to replay it move by move.
        </Text>

        {games.length === 0 ? (
          <Card>
            <Text style={typography.h3}>No games yet</Text>
            <Text style={[typography.muted, { marginTop: 4 }]}>
              Play a game — vs the computer, a friend, a master, or online — and it’ll show up here.
            </Text>
          </Card>
        ) : (
          <>
            <Group>
              {games.map((g, i) => {
                const rt = resultTone(g.result);
                return (
                  <Row
                    key={g.id}
                    first={i === 0}
                    last={i === games.length - 1}
                    title={`${g.white} vs ${g.black}`}
                    subtitle={`${modeLabel(g.mode)} · ${when(g.date)}`}
                    left={
                      <View style={styles.tile}>
                        <Icon name={MODE_ICON[g.mode] ?? 'game-controller'} size={18} color="#fff" />
                      </View>
                    }
                    right={<Text style={[styles.result, { color: rt.color }]}>{rt.label}</Text>}
                    onPress={() =>
                      navigation.navigate('LiveGame', {
                        pgn: g.pgn,
                        white: g.white,
                        black: g.black,
                        event: `${modeLabel(g.mode)} · ${when(g.date)}`,
                        result: g.result,
                      })
                    }
                  />
                );
              })}
            </Group>
            <View style={{ marginTop: spacing.lg }}>
              <Button
                label="Clear history"
                variant="outline"
                onPress={async () => {
                  await clearGames();
                  load();
                }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  tile: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  result: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
