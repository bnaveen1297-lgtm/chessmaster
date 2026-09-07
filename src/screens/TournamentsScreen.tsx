import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, Segmented, Group, Row, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import {
  tournamentsAvailable,
  listTournaments,
  createTournament,
  type Tournament,
} from '../services/tournaments';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Tournaments'>;

const FORMAT_LABEL: Record<string, string> = { roundrobin: 'Round-robin', knockout: 'Knockout' };
const SIZES = [4, 8, 16];

export function TournamentsScreen({ navigation }: Props) {
  const available = tournamentsAvailable();
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [formatLabel, setFormatLabel] = useState('Round-robin');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!available) {
      setLoading(false);
      return;
    }
    try {
      setItems(await listTournaments());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load tournaments.');
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const t = await createTournament({
        name: name.trim() || 'ChessMaster Open',
        format: formatLabel === 'Knockout' ? 'knockout' : 'roundrobin',
        maxPlayers,
      });
      setCreating(false);
      setName('');
      navigation.navigate('TournamentDetail', { id: t.id });
    } catch (e: any) {
      setError(e?.message ?? 'Could not create the tournament.');
    } finally {
      setBusy(false);
    }
  }, [name, formatLabel, maxPlayers, navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textMuted} />}
      >
        <Text style={typography.display}>Tournaments</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Create a round-robin or knockout and invite other players.
        </Text>

        {!available && (
          <Card>
            <Text style={typography.h3}>Sign in to run tournaments</Text>
            <Text style={[typography.muted, { marginTop: 4 }]}>
              Tournaments use your ChessMaster account and aren't available in offline/demo mode.
            </Text>
          </Card>
        )}

        {available && !creating && (
          <Card style={styles.hero} onPress={() => setCreating(true)}>
            <View style={styles.heroRow}>
              <View style={styles.heroGlyph}><Icon name="add" size={24} color={colors.onDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Create tournament</Text>
                <Text style={styles.heroSub}>Round-robin or knockout · you organize</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </Card>
        )}

        {available && creating && (
          <Card>
            <Text style={typography.h3}>New tournament</Text>
            <View style={{ height: spacing.md }} />
            <Input placeholder="Tournament name" value={name} onChangeText={setName} />
            <Text style={styles.fieldLabel}>FORMAT</Text>
            <Segmented options={['Round-robin', 'Knockout']} value={formatLabel} onChange={setFormatLabel} />
            <Text style={styles.formatHelp}>
              {formatLabel === 'Knockout'
                ? 'Single elimination — lose once and you’re out. Fast, dramatic.'
                : 'Everyone plays everyone once. Most points wins. Fairest ranking.'}
            </Text>
            <Text style={styles.fieldLabel}>MAX PLAYERS</Text>
            <View style={styles.sizeRow}>
              {SIZES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setMaxPlayers(s)}
                  style={[styles.sizeChip, maxPlayers === s && styles.sizeChipActive]}
                >
                  <Text style={[styles.sizeText, maxPlayers === s && styles.sizeTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: spacing.md }} />
            <View style={styles.formActions}>
              <View style={{ flex: 1 }}>
                <Button label={busy ? 'Creating…' : 'Create'} onPress={busy ? undefined : create} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="outline" onPress={() => setCreating(false)} />
              </View>
            </View>
          </Card>
        )}

        {available && (
          <>
            <Text style={styles.label}>ALL TOURNAMENTS</Text>
            {loading ? (
              <ActivityIndicator color={colors.textMuted} style={{ marginTop: spacing.lg }} />
            ) : items.length === 0 ? (
              <Card>
                <Text style={typography.muted}>No tournaments yet. Create the first one above.</Text>
              </Card>
            ) : (
              <Group>
                {items.map((t, i) => (
                  <Row
                    key={t.id}
                    first={i === 0}
                    last={i === items.length - 1}
                    title={t.name}
                    subtitle={`${FORMAT_LABEL[t.format]} · up to ${t.max_players}`}
                    left={<Icon name={t.format === 'knockout' ? 'git-network' : 'grid'} size={20} color={colors.tint} />}
                    right={
                      <Pill
                        label={t.status === 'lobby' ? 'OPEN' : t.status === 'running' ? 'LIVE' : 'DONE'}
                        tone={t.status === 'running' ? 'live' : t.status === 'lobby' ? 'success' : 'default'}
                      />
                    }
                    onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
                  />
                ))}
              </Group>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
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
  fieldLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },
  formatHelp: { ...typography.muted, marginTop: 2 },
  sizeRow: { flexDirection: 'row', gap: spacing.sm },
  sizeChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.fill, alignItems: 'center' },
  sizeChipActive: { backgroundColor: colors.ink },
  sizeText: { ...typography.body, fontWeight: '700', color: colors.textMuted },
  sizeTextActive: { color: colors.onDark },
  formActions: { flexDirection: 'row', gap: spacing.md },
  error: { ...typography.muted, color: colors.danger, marginTop: spacing.md },
});
