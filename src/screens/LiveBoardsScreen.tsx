import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Group, Row, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, radius, spacing, typography } from '../theme';
import { findOlympiadRound, fetchRoundBoards, type Board } from '../services/broadcast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveBoards'>;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; boards: Board[]; roundName: string; tourName: string };

function resultPill(result: string): { label: string; tone: 'default' | 'live' | 'gold' | 'success' } {
  switch (result) {
    case '1-0':
      return { label: '1–0', tone: 'default' };
    case '0-1':
      return { label: '0–1', tone: 'default' };
    case '1/2-1/2':
      return { label: '½–½', tone: 'default' };
    default:
      return { label: 'LIVE', tone: 'live' };
  }
}

export function LiveBoardsScreen({ navigation }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const found = await findOlympiadRound();
      if (!found) {
        setState({
          status: 'error',
          message:
            'Live boards appear here during the Olympiad — check back on 15–27 Sep 2026.',
        });
        return;
      }
      const boards = await fetchRoundBoards(found.round.id);
      setState({
        status: 'ready',
        boards,
        roundName: found.round.name,
        tourName: found.tour.name,
      });
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : 'Could not reach the live broadcast.',
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={styles.topbar}>
          <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
          <Pressable
            onPress={load}
            hitSlop={8}
            style={({ pressed }) => [styles.refresh, pressed && { opacity: 0.6 }]}
          >
            <Icon name="refresh" size={16} color={colors.samarkand} />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Live boards</Text>
        <Text style={styles.sub}>
          Live games relayed from the official DGT boards via Lichess.
        </Text>

        {state.status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.samarkand} />
            <Text style={styles.centerText}>Reaching the live broadcast…</Text>
          </View>
        )}

        {state.status === 'error' && (
          <Card style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Icon name="planet-outline" size={22} color={colors.samarkand} />
            </View>
            <Text style={styles.errorTitle}>No live boards right now</Text>
            <Text style={styles.errorBody}>{state.message}</Text>
            <Pressable
              onPress={load}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </Card>
        )}

        {state.status === 'ready' && state.boards.length === 0 && (
          <Card style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Icon name="time-outline" size={22} color={colors.samarkand} />
            </View>
            <Text style={styles.errorTitle}>Round not started</Text>
            <Text style={styles.errorBody}>
              The broadcast is live but no boards have appeared yet. Pull Refresh once the round begins.
            </Text>
          </Card>
        )}

        {state.status === 'ready' && state.boards.length > 0 && (
          <>
            <Text style={styles.roundLabel}>{state.tourName.toUpperCase()}</Text>
            {state.roundName ? <Text style={styles.roundName}>{state.roundName}</Text> : null}
            <Group style={{ marginTop: spacing.sm }}>
              {state.boards.map((b, i) => {
                const rp = resultPill(b.result);
                return (
                  <Row
                    key={b.id}
                    first={i === 0}
                    last={i === state.boards.length - 1}
                    title={`${b.white} vs ${b.black}`}
                    subtitle={`Board ${b.board}`}
                    left={
                      <View style={styles.boardBadge}>
                        <Text style={styles.boardNum}>{b.board}</Text>
                      </View>
                    }
                    right={<Pill label={rp.label} tone={rp.tone} />}
                    onPress={() =>
                      navigation.navigate('LiveGame', {
                        pgn: b.pgn,
                        white: b.white,
                        black: b.black,
                        event: b.event,
                        result: b.result,
                      })
                    }
                  />
                );
              })}
            </Group>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { ...typography.body, color: colors.samarkand },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { color: colors.samarkand, fontWeight: '600', fontSize: 15 },
  title: { ...typography.h1, marginTop: spacing.sm },
  sub: { ...typography.muted, marginTop: 2, marginBottom: spacing.md },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  centerText: { ...typography.muted },
  errorCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { ...typography.h3 },
  errorBody: { ...typography.muted, textAlign: 'center', paddingHorizontal: spacing.md },
  retryBtn: {
    marginTop: spacing.xs,
    backgroundColor: colors.samarkand,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
  },
  retryText: { color: colors.onDark, fontWeight: '700', fontSize: 14 },
  roundLabel: { ...typography.label, color: colors.textMuted, marginLeft: spacing.xs },
  roundName: { ...typography.h3, marginLeft: spacing.xs, marginTop: 2 },
  boardBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.samarkandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardNum: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
