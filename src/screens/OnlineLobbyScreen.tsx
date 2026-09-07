import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Group, Row } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import {
  onlineAvailable,
  listOpenMatches,
  listMyActiveMatches,
  createOpenMatch,
  joinMatch,
  subscribeLobby,
  unsubscribe,
  getNames,
  type Match,
} from '../services/online';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OnlineLobby'>;

export function OnlineLobbyScreen({ navigation }: Props) {
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const [open, setOpen] = useState<Match[]>([]);
  const [mine, setMine] = useState<Match[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = onlineAvailable();

  const refresh = useCallback(async () => {
    if (!available) {
      setLoading(false);
      return;
    }
    try {
      const [o, m] = await Promise.all([listOpenMatches(), listMyActiveMatches()]);
      setOpen(o);
      setMine(m);
      setNames(await getNames([...o.map((x) => x.white_id), ...m.map((x) => x.white_id), ...m.map((x) => x.black_id)]));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load games.');
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    refresh();
    if (!available) return;
    let ch: ReturnType<typeof subscribeLobby> | null = null;
    try {
      ch = subscribeLobby(refresh);
    } catch {
      /* ignore */
    }
    return () => unsubscribe(ch);
  }, [refresh, available]);

  const create = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await createOpenMatch();
      navigation.navigate('OnlineGame', { matchId: m.id, uid });
    } catch (e: any) {
      setError(e?.message ?? 'Could not create a game.');
    } finally {
      setBusy(false);
    }
  }, [navigation, uid]);

  const join = useCallback(
    async (id: string) => {
      setBusy(true);
      setError(null);
      try {
        await joinMatch(id);
        navigation.navigate('OnlineGame', { matchId: id, uid });
      } catch (e: any) {
        setError(e?.message ?? 'Could not join.');
        refresh();
      } finally {
        setBusy(false);
      }
    },
    [navigation, uid, refresh],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textMuted} />}
      >
        <Text style={typography.display}>Play online</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Real-time games against other signed-in players.
        </Text>

        {!available && (
          <Card>
            <Text style={typography.h3}>Sign in to play online</Text>
            <Text style={[typography.muted, { marginTop: 4 }]}>
              Online play uses your ChessMaster account. It isn't available in offline/demo mode.
            </Text>
          </Card>
        )}

        {available && (
          <>
            <Card style={styles.hero} onPress={busy ? undefined : create}>
              <View style={styles.heroRow}>
                <View style={styles.heroGlyph}><Icon name="flash" size={24} color={colors.onDark} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>New game</Text>
                  <Text style={styles.heroSub}>Create a challenge and wait for an opponent</Text>
                </View>
                {busy ? <ActivityIndicator color={colors.onDark} /> : <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />}
              </View>
            </Card>

            {mine.length > 0 && (
              <>
                <Text style={styles.label}>YOUR GAMES</Text>
                <Group>
                  {mine.map((m, i) => {
                    const oppId = m.white_id === uid ? m.black_id : m.white_id;
                    return (
                      <Row
                        key={m.id}
                        first={i === 0}
                        last={i === mine.length - 1}
                        title={oppId ? `vs ${names[oppId] ?? 'Opponent'}` : 'Waiting for opponent…'}
                        subtitle={m.white_id === uid ? 'You are White' : 'You are Black'}
                        left={<Icon name="game-controller" size={20} color={colors.tint} />}
                        right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
                        onPress={() => navigation.navigate('OnlineGame', { matchId: m.id, uid })}
                      />
                    );
                  })}
                </Group>
              </>
            )}

            <Text style={styles.label}>OPEN CHALLENGES</Text>
            {loading ? (
              <ActivityIndicator color={colors.textMuted} style={{ marginTop: spacing.lg }} />
            ) : open.length === 0 ? (
              <Card>
                <Text style={typography.muted}>No open challenges right now. Create one above and share the app — the first player to join starts your game.</Text>
              </Card>
            ) : (
              <Group>
                {open.map((m, i) => (
                  <Row
                    key={m.id}
                    first={i === 0}
                    last={i === open.length - 1}
                    title={m.white_id ? names[m.white_id] ?? 'A player' : 'A player'}
                    subtitle="Wants to play · tap to join as Black"
                    left={<Icon name="person" size={20} color={colors.tint} />}
                    right={<Button label="Join" small onPress={() => join(m.id)} />}
                  />
                ))}
              </Group>
            )}

            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.tint },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroGlyph: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...typography.h3, color: colors.onDark },
  heroSub: { ...typography.muted, color: 'rgba(255,255,255,0.8)' },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  error: { ...typography.muted, color: colors.danger, marginTop: spacing.md },
});
