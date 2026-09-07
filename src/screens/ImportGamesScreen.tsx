import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, Segmented, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { fetchGames, type ImportSource, type ImportedGame } from '../services/importGames';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportGames'>;

const SOURCES = ['Chess.com', 'Lichess'];

function resultLabel(r: string): string {
  return r === '1-0' ? '1–0' : r === '0-1' ? '0–1' : r === '1/2-1/2' ? '½–½' : '·';
}

export function ImportGamesScreen({ navigation }: Props) {
  const [sourceLabel, setSourceLabel] = useState('Chess.com');
  const [username, setUsername] = useState('');
  const [games, setGames] = useState<ImportedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const source: ImportSource = sourceLabel === 'Lichess' ? 'lichess' : 'chesscom';

  const run = useCallback(async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const rows = await fetchGames(source, username, 15);
      setGames(rows);
    } catch (e: any) {
      setGames([]);
      setError(e?.message ?? 'Could not fetch games.');
    } finally {
      setLoading(false);
    }
  }, [source, username]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Back</Text>
        <Text style={typography.display}>Import games</Text>
        <Text style={[typography.muted, { marginTop: 2, marginBottom: spacing.md }]}>
          Pull your recent games from Chess.com or Lichess, then replay or run an engine review.
        </Text>

        <Card>
          <Text style={styles.fieldLabel}>SOURCE</Text>
          <Segmented options={SOURCES} value={sourceLabel} onChange={setSourceLabel} />
          <Text style={styles.fieldLabel}>USERNAME</Text>
          <Input
            placeholder={source === 'lichess' ? 'e.g. DrNykterstein' : 'e.g. MagnusCarlsen'}
            value={username}
            onChangeText={setUsername}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label={loading ? 'Fetching…' : 'Import recent games'}
            onPress={loading || !username.trim() ? undefined : run}
          />
        </Card>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.tint} />
            <Text style={typography.muted}>Fetching from {sourceLabel}…</Text>
          </View>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Icon name="alert-circle" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {!loading && searched && !error && games.length === 0 && (
          <Card>
            <Text style={typography.muted}>No games found for that username.</Text>
          </Card>
        )}

        {games.length > 0 && <Text style={styles.label}>{games.length} RECENT GAMES</Text>}
        {games.map((g) => (
          <Card key={g.id}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3} numberOfLines={1}>{g.white} vs {g.black}</Text>
                <Text style={typography.muted}>{g.event}{g.date ? ` · ${g.date}` : ''}</Text>
              </View>
              <Pill label={resultLabel(g.result)} tone={g.result === '1/2-1/2' ? 'default' : 'gold'} />
            </View>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Analyse" small onPress={() => navigation.navigate('Analyze', { pgn: g.pgn })} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Watch"
                  variant="outline"
                  small
                  onPress={() =>
                    navigation.navigate('LiveGame', {
                      pgn: g.pgn,
                      white: g.white,
                      black: g.black,
                      event: `${g.event}${g.date ? ` · ${g.date}` : ''}`,
                      result: g.result,
                    })
                  }
                />
              </View>
            </View>
          </Card>
        ))}

        {!searched && (
          <View style={styles.note}>
            <Icon name="information-circle" size={16} color={colors.textMuted} />
            <Text style={styles.noteText}>
              Uses each site’s public API — no password needed. Only public games are returned.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.sm },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  errorText: { color: colors.danger, fontWeight: '600', flex: 1 },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  note: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginHorizontal: spacing.xs, alignItems: 'flex-start' },
  noteText: { ...typography.muted, flex: 1 },
});
