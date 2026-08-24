import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { Piece } from './Piece';

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
  onSquarePress?: (square: string) => void;
  selected?: string | null;
  highlights?: string[];
  lastMove?: { from: string; to: string } | null;
  /** King square that is currently in check — highlighted purple. */
  checkSquare?: string | null;
  showCoords?: boolean;
  /** Render from Black's perspective (black at the bottom). */
  flipped?: boolean;
};

const CHECK = 'rgba(124,58,237,0.60)'; // brand purple
const LAST_LIGHT = '#EAD79A';
const LAST_DARK = '#C7A85A';

export function ChessBoard({
  fen = START_FEN,
  size = 320,
  onSquarePress,
  selected,
  highlights = [],
  lastMove,
  checkSquare,
  showCoords = true,
  flipped = false,
}: BoardProps) {
  const board = parseFen(fen);
  const cell = size / 8;
  const highlightSet = new Set(highlights);
  const pieceSize = cell * 0.88;
  const labelSize = Math.max(8, cell * 0.2);

  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {Array.from({ length: 8 }).map((_, dr) => (
        <View key={dr} style={styles.row}>
          {Array.from({ length: 8 }).map((_, dc) => {
            const r = flipped ? 7 - dr : dr;
            const c = flipped ? 7 - dc : dc;
            const piece = board[r][c];
            const square = `${FILES[c]}${8 - r}`;
            const dark = (r + c) % 2 === 1;
            const isSelected = selected === square;
            const isTarget = highlightSet.has(square);
            const isCheck = checkSquare === square;
            const isLast = !!lastMove && (lastMove.from === square || lastMove.to === square);

            const bg = isCheck
              ? CHECK
              : isSelected
                ? colors.gold
                : isLast
                  ? dark ? LAST_DARK : LAST_LIGHT
                  : dark
                    ? colors.boardDark
                    : colors.boardLight;

            const labelColor = dark ? colors.boardLight : colors.boardDark;

            const content = (
              <>
                {showCoords && dc === 0 && (
                  <Text style={[styles.rankLabel, { fontSize: labelSize, color: labelColor }]}>{8 - r}</Text>
                )}
                {showCoords && dr === 7 && (
                  <Text style={[styles.fileLabel, { fontSize: labelSize, color: labelColor }]}>{FILES[c]}</Text>
                )}
                {piece && <Piece piece={piece} size={pieceSize} />}
                {isTarget && (
                  <View
                    pointerEvents="none"
                    style={[
                      piece ? styles.captureRing : styles.dot,
                      piece
                        ? { width: cell, height: cell, borderRadius: cell, borderWidth: Math.max(2, cell * 0.06) }
                        : { width: cell * 0.32, height: cell * 0.32, borderRadius: cell },
                    ]}
                  />
                )}
              </>
            );

            const style = [styles.cell, { width: cell, height: cell, backgroundColor: bg }];

            return onSquarePress ? (
              <Pressable key={dc} style={style} onPress={() => onSquarePress(square)} accessibilityLabel={`sq-${square}`} testID={`sq-${square}`}>
                {content}
              </Pressable>
            ) : (
              <View key={dc} style={style} accessibilityLabel={`sq-${square}`}>
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
  captureRing: { position: 'absolute', backgroundColor: 'transparent', borderColor: 'rgba(46,158,107,0.75)' },
  rankLabel: { position: 'absolute', top: 1, left: 2, fontWeight: '700' },
  fileLabel: { position: 'absolute', bottom: 1, right: 2, fontWeight: '700' },
});
