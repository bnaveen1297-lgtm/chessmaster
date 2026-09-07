import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Group, Row, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../services/supabase';
import { getNames, type Match } from '../services/online';
import {
  getTournament,
  listPlayers,
  standings as computeStandings,
  matchesForRound,
  joinTournament,
  leaveTournament,
  startTournament,
  advanceRound,
  roundComplete,
  type Tournament,
  type TournamentPlayer,
} from '../services/tournaments';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TournamentDetail'>;

const FORMAT_LABEL: Record<string, string> = { roundrobin: 'Round-robin', knockout: 'Knockout' };

export function TournamentDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const uid = user?.id ?? '';

  const [t, setT] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [standings, setStandings] = useState<TournamentPlayer[]>([]);
  const [roundMatches, setRoundMatches] = useState<Match[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [canAdvance, setCanAdvance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const tour = await getTournament(id);
      setT(tour);
      const [pl, sd] = await Promise.all([listPlayers(id), computeStandings(id)]);
      setPlayers(pl);
      setStandings(sd);
      const rm = tour.current_round > 0 ? await matchesForRound(id, tour.current_round) : [];
      setRoundMatches(rm);
      setNames(await getNames([...pl.map((p) => p.user_id), ...rm.map((m) => m.white_id), ...rm.map((m) => m.black_id)]));
      setCanAdvance(tour.status === 'running' ? await roundComplete(id, tour.current_round) : false);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load tournament.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
    const sb = supabase;
    if (!sb) return;
    const ch = sb
      .channel(`tournament:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_players', filter: `tournament_id=eq.${id}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, refresh)
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [id, refresh]);

  const act = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.tint} />
      </SafeAreaView>
    );
  }
  if (!t) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={styles.error}>{error ?? 'Not found.'}</Text>
      </SafeAreaView>
    );
  }

  const isOrganizer = t.created_by === uid;
  const joined = players.some((p) => p.user_id === uid);
  const myMatch = roundMatches.find((m) => (m.white_id === uid || m.black_id === uid) && m.status === 'active');
  const nameOf = (pid: string | null) => (pid ? names[pid] ?? 'Player' : 'Bye');
  const champion = t.status === 'finished' ? standings[0] : null;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textMuted} />}
      >
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
        <View style={styles.titleRow}>
          <Text style={[typography.display, { flex: 1 }]}>{t.name}</Text>
          <Pill
            label={t.status === 'lobby' ? 'OPEN' : t.status === 'running' ? 'LIVE' : 'FINISHED'}
            tone={t.status === 'running' ? 'live' : t.status === 'lobby' ? 'success' : 'default'}
          />
        </View>
        <Text style={[typography.muted, { marginBottom: spacing.md }]}>
          {FORMAT_LABEL[t.format]} · {players.length}/{t.max_players} players
          {t.status === 'running' && t.total_rounds ? ` · round ${t.current_round}/${t.total_rounds}` : ''}
        </Text>

        {champion && (
          <Card style={styles.champ}>
            <View style={styles.champRow}>
              <Icon name="trophy" size={26} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.champLabel}>CHAMPION</Text>
                <Text style={styles.champName}>{nameOf(champion.user_id)}</Text>
              </View>
              <Text style={styles.champScore}>{champion.score} pts</Text>
            </View>
          </Card>
        )}

        {/* Your game this round */}
        {myMatch && (
          <Card style={styles.myGame} onPress={() => navigation.navigate('OnlineGame', { matchId: myMatch.id, uid })}>
            <View style={styles.heroRow}>
              <View style={styles.heroGlyph}><Icon name="game-controller" size={22} color={colors.onDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Your game is ready</Text>
                <Text style={styles.heroSub}>
                  vs {nameOf(myMatch.white_id === uid ? myMatch.black_id : myMatch.white_id)} · tap to play
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </Card>
        )}

        {/* Organizer + player controls */}
        <View style={styles.controls}>
          {t.status === 'lobby' && !isOrganizer && (
            <View style={{ flex: 1 }}>
              <Button
                label={joined ? 'Leave' : 'Join tournament'}
                variant={joined ? 'outline' : 'primary'}
                onPress={busy ? undefined : () => act(() => (joined ? leaveTournament(id) : joinTournament(id)))}
              />
            </View>
          )}
          {t.status === 'lobby' && isOrganizer && (
            <View style={{ flex: 1 }}>
              <Button
                label={players.length < 2 ? 'Need 2+ players' : busy ? 'Starting…' : 'Start tournament'}
                onPress={players.length < 2 || busy ? undefined : () => act(() => startTournament(t))}
              />
            </View>
          )}
          {t.status === 'running' && isOrganizer && (
            <View style={{ flex: 1 }}>
              <Button
                label={canAdvance ? (busy ? 'Advancing…' : 'Next round') : 'Waiting for games…'}
                onPress={canAdvance && !busy ? () => act(() => advanceRound(t)) : undefined}
              />
            </View>
          )}
        </View>

        {/* Standings (running/finished) */}
        {t.status !== 'lobby' && standings.length > 0 && (
          <>
            <Text style={styles.label}>STANDINGS</Text>
            <Group>
              {standings.map((p, i) => (
                <Row
                  key={p.user_id}
                  first={i === 0}
                  last={i === standings.length - 1}
                  title={`${i + 1}.  ${nameOf(p.user_id)}${p.user_id === uid ? '  (you)' : ''}`}
                  subtitle={p.eliminated ? 'Eliminated' : undefined}
                  left={<Text style={styles.rank}>{i + 1}</Text>}
                  right={<Text style={styles.score}>{p.score}</Text>}
                />
              ))}
            </Group>
          </>
        )}

        {/* Current round pairings */}
        {t.status === 'running' && roundMatches.length > 0 && (
          <>
            <Text style={styles.label}>ROUND {t.current_round}</Text>
            <Group>
              {roundMatches.map((m, i) => (
                <Row
                  key={m.id}
                  first={i === 0}
                  last={i === roundMatches.length - 1}
                  title={`${nameOf(m.white_id)}  vs  ${m.black_id ? nameOf(m.black_id) : 'Bye'}`}
                  subtitle={m.status === 'finished' ? `Result ${m.result}` : 'In progress'}
                  left={<Text style={styles.board}>#{m.board}</Text>}
                  right={
                    m.status === 'finished' ? (
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                    ) : (
                      <View style={styles.playingDot} />
                    )
                  }
                />
              ))}
            </Group>
          </>
        )}

        {/* Lobby player list */}
        {t.status === 'lobby' && (
          <>
            <Text style={styles.label}>PLAYERS</Text>
            <Group>
              {players.map((p, i) => (
                <Row
                  key={p.user_id}
                  first={i === 0}
                  last={i === players.length - 1}
                  title={`${nameOf(p.user_id)}${p.user_id === uid ? '  (you)' : ''}${p.user_id === t.created_by ? '  · organizer' : ''}`}
                  left={<Icon name="person" size={20} color={colors.tint} />}
                />
              ))}
              {players.length === 0 && <Row title="No players yet" />}
            </Group>
            <Text style={styles.hint}>
              Share the app with friends — they open Game › Tournaments, tap this event and Join. When everyone’s in, the organizer starts it.
            </Text>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  champ: { backgroundColor: colors.ink },
  champRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  champLabel: { ...typography.label, color: colors.gold },
  champName: { ...typography.h2, color: colors.onDark },
  champScore: { ...typography.h3, color: colors.gold },
  myGame: { backgroundColor: colors.tint },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroGlyph: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...typography.h3, color: colors.onDark },
  heroSub: { ...typography.muted, color: 'rgba(255,255,255,0.8)' },
  controls: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  rank: { width: 22, textAlign: 'center', fontWeight: '700', color: colors.textMuted },
  score: { ...typography.h3, color: colors.ink },
  board: { width: 28, fontWeight: '700', color: colors.textMuted },
  playingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  hint: { ...typography.muted, marginTop: spacing.md, marginHorizontal: spacing.xs },
  error: { ...typography.muted, color: colors.danger, marginTop: spacing.md },
});
