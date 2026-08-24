import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';

// Use the filled (solid) glyphs for BOTH colors, then tint by side — solid
// silhouettes read far better at small sizes than the thin outline whites.
const SOLID: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
function glyphFor(piece: string): string {
  return SOLID[piece.toLowerCase()];
}
function isWhitePiece(piece: string): boolean {
  return piece === piece.toUpperCase();
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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

export type BoardProps = {
  fen?: string;
  size?: number;
  /** Called with the algebraic square (e.g. "e4") when a square is tapped. */
  onSquarePress?: (square: string) => void;
  /** Currently selected square, drawn with a ring. */
  selected?: string | null;
  /** Legal target squares for the selection, drawn with dots. */
  highlights?: string[];
  /** Highlight the last move's from/to squares. */
  lastMove?: { from: string; to: string } | null;
};

export function ChessBoard({
  fen = START_FEN,
  size = 320,
  onSquarePress,
  selected,
  highlights = [],
  lastMove,
}: BoardProps) {
  const board = parseFen(fen);
  const cell = size / 8;
  const highlightSet = new Set(highlights);

  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((piece, c) => {
            const square = `${FILES[c]}${8 - r}`;
            const dark = (r + c) % 2 === 1;
            const isSelected = selected === square;
            const isTarget = highlightSet.has(square);
            const isLast = lastMove && (lastMove.from === square || lastMove.to === square);

            const white = piece ? isWhitePiece(piece) : false;
            const content = (
              <>
                {piece && (
                  <Text
                    style={{
                      fontSize: cell * 0.78,
                      lineHeight: cell,
                      color: white ? '#F7F7F5' : '#1B1B1E',
                      textShadowColor: white ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)',
                      textShadowOffset: { width: 0, height: 0.5 },
                      textShadowRadius: white ? 1.2 : 0.8,
                    }}
                  >
                    {glyphFor(piece)}
                  </Text>
                )}
                {isTarget && <View style={[styles.dot, piece ? styles.captureRing : null, { width: cell * 0.3, height: cell * 0.3, borderRadius: cell }]} />}
              </>
            );

            const bg = isSelected
              ? colors.gold
              : isLast
                ? (dark ? '#B9A45C' : '#E9DDA0')
                : dark
                  ? colors.boardDark
                  : colors.boardLight;

            const style = [styles.cell, { width: cell, height: cell, backgroundColor: bg }];

            return onSquarePress ? (
              <Pressable
                key={c}
                style={style}
                onPress={() => onSquarePress(square)}
                accessibilityLabel={`sq-${square}`}
                testID={`sq-${square}`}
              >
                {content}
              </Pressable>
            ) : (
              <View key={c} style={style} accessibilityLabel={`sq-${square}`}>
                {content}
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
  dot: { position: 'absolute', backgroundColor: 'rgba(46,158,107,0.55)' },
  captureRing: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'rgba(211,82,75,0.7)',
  },
});
