import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button, Group, Row } from '../components/ui';
import { Icon } from '../components/Icon';
import { colors, spacing, typography } from '../theme';
import { getMasterGame } from '../data/masters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterGame'>;

export function MasterGameScreen({ route, navigation }: Props) {
  const game = getMasterGame(route.params.id);
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - spacing.md * 2, 320);

  const finalFen = useMemo(() => {
    if (!game) return undefined;
    const c = new Chess();
    try {
      c.loadPgn(game.pgn);
    } catch {
      /* ignore */
    }
    return c.fen();
  }, [game]);

  if (!game) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={typography.body}>Game not found.</Text>
      </SafeAreaView>
    );
  }

  const resultText = game.result === '1/2-1/2' ? 'Draw' : game.result === '1-0' ? 'White won' : 'Black won';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹ Master Base</Text>

        {game.nickname && <Text style={typography.display}>{game.nickname}</Text>}
        <Text style={styles.players}>{game.white}  vs  {game.black}</Text>
        <Text style={[typography.muted, { marginBottom: spacing.md }]}>{game.event}, {game.year}</Text>

        <View style={styles.boardWrap}>
          <ChessBoard fen={finalFen ?? ''} size={boardSize} showCoords />
        </View>
        <Text style={styles.finalCaption}>Final position · {resultText}</Text>

        <Group style={{ marginTop: spacing.md }}>
          <Row first title="Opening" right={<Text style={styles.metaVal}>{game.opening}{game.eco ? `  (${game.eco})` : ''}</Text>} />
          <Row title="Result" right={<Text style={styles.metaVal}>{game.result}</Text>} />
          <Row last title="Themes" right={<Text style={styles.metaVal}>{game.themes.join(' · ')}</Text>} />
        </Group>

        <Text style={styles.label}>PLAY THIS GAME</Text>
        <Text style={styles.sub}>
          Take a side. The master plays their real moves against you; go off their path and the engine takes over — try to beat the line.
        </Text>
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Play as White" onPress={() => navigation.navigate('PlayVsMaster', { id: game.id, side: 'w' })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Play as Black" variant="outline" onPress={() => navigation.navigate('PlayVsMaster', { id: game.id, side: 'b' })} />
          </View>
        </View>

        <Text style={styles.label}>STUDY</Text>
        <Group>
          <Row
            first
            title="Watch the replay"
            subtitle="Step through every move"
            left={<View style={[styles.tile, { backgroundColor: colors.gold }]}><Icon name="play" size={18} color={colors.ink} /></View>}
            right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
            onPress={() =>
              navigation.navigate('LiveGame', {
                pgn: game.pgn,
                white: game.white,
                black: game.black,
                event: `${game.event}, ${game.year}`,
                result: game.result,
              })
            }
          />
          <Row
            last
            title="Engine review"
            subtitle="Accuracy, blunders, best moves"
            left={<View style={[styles.tile, { backgroundColor: colors.tint }]}><Icon name="stats-chart" size={18} color="#fff" /></View>}
            right={<Icon name="chevron-forward" size={18} color={colors.textFaint} />}
            onPress={() => navigation.navigate('Analyze', { pgn: game.pgn })}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { ...typography.body, color: colors.tint, marginBottom: spacing.sm },
  players: { ...typography.h3, marginTop: 2 },
  boardWrap: { alignItems: 'center', marginTop: spacing.sm },
  finalCaption: { ...typography.muted, textAlign: 'center', marginTop: spacing.sm },
  metaVal: { ...typography.muted, color: colors.ink, fontWeight: '600', maxWidth: 200, textAlign: 'right' },
  label: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
  sub: { ...typography.muted, marginLeft: spacing.xs, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md },
  tile: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
