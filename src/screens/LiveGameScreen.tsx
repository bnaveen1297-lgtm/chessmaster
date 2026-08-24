import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../components/ChessBoard';
import { Pill } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { liveGames } from '../data/content';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveGame'>;

const MOVES = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6';

export function LiveGameScreen({ route, navigation }: Props) {
  const game = liveGames.find((g) => g.id === route.params.id) ?? liveGames[0];

  return (
    <SafeAreaView style={styles.screen}>
      {/* players */}
      <View style={styles.topbar}>
        <Text style={styles.back} onPress={() => navigation.goBack()}>‹</Text>
        <View style={styles.players}>
          <Player name={game.white} color="⚪" />
          <Player name={game.black} color="⚫" />
        </View>
        {game.status === 'live' ? <Pill label="LIVE" tone="live" /> : <View style={{ width: 40 }} />}
      </View>

      <View style={styles.boardWrap}>
        <ChessBoard fen={game.fen} size={320} />
      </View>

      <View style={styles.info}>
        <Text style={styles.eval}>Engine eval {game.eval}</Text>
        <Text style={styles.moves}>{MOVES}</Text>
      </View>

      {/* playback controls */}
      <View style={styles.controls}>
        {['🎙️', '📷', '⏮', '◀', '⏸', '▶', '⏭'].map((c, i) => (
          <View key={i} style={styles.ctrl}><Text style={styles.ctrlGlyph}>{c}</Text></View>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Player({ name, color }: { name: string; color: string }) {
  return (
    <View style={styles.player}>
      <Text style={styles.playerAvatar}>{color}</Text>
      <Text style={styles.playerName}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.dark, padding: spacing.md, justifyContent: 'space-between' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.onDark, fontSize: 30, width: 40 },
  players: { flexDirection: 'row', gap: spacing.md },
  player: { alignItems: 'center' },
  playerAvatar: { fontSize: 26 },
  playerName: { color: colors.onDark, fontSize: 11, fontWeight: '600' },
  boardWrap: { alignItems: 'center' },
  info: { alignItems: 'center', gap: spacing.sm },
  eval: { color: colors.gold, fontWeight: '700' },
  moves: { color: '#C9C9CF', textAlign: 'center', lineHeight: 22 },
  controls: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.darkAlt, borderRadius: radius.pill, padding: spacing.sm,
  },
  ctrl: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  ctrlGlyph: { fontSize: 16, color: colors.onDark },
});
