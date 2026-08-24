import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const GLYPH: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

/** Parse the piece-placement field of a FEN into an 8x8 array. */
function parseFen(fen: string): (string | null)[][] {
  const placement = fen.split(' ')[0];
  return placement.split('/').map((row) => {
    const cells: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) cells.push(null);
      } else {
        cells.push(ch);
      }
    }
    return cells;
  });
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function ChessBoard({ fen = START_FEN, size = 320 }: { fen?: string; size?: number }) {
  const board = parseFen(fen);
  const cell = size / 8;
  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((piece, c) => {
            const dark = (r + c) % 2 === 1;
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  { width: cell, height: cell, backgroundColor: dark ? colors.boardDark : colors.boardLight },
                ]}
              >
                {piece && (
                  <Text style={{ fontSize: cell * 0.72, lineHeight: cell }}>{GLYPH[piece]}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderRadius: 6, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
});
