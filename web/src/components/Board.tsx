import { useMemo } from 'react';
import { Chess } from 'chess.js';

const GLYPH: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export type BoardProps = {
  fen: string;
  onSquarePress?: (sq: string) => void;
  selected?: string | null;
  highlights?: string[];
  lastMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
  flipped?: boolean;
  coords?: boolean;
  interactive?: boolean;
};

export function Board({
  fen, onSquarePress, selected, highlights = [], lastMove, checkSquare, flipped, coords = true, interactive = true,
}: BoardProps) {
  const grid = useMemo(() => {
    let c: Chess;
    try {
      c = new Chess(fen);
    } catch {
      c = new Chess();
    }
    return c.board(); // rank 8 -> 1, files a..h
  }, [fen]);

  const ranks = flipped ? [...grid].reverse() : grid;

  return (
    <div
      className="relative aspect-square w-full select-none overflow-hidden rounded-2xl shadow-lift"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)', containerType: 'inline-size' }}
    >
      {ranks.map((row, ri) => {
        const cols = flipped ? [...row].reverse() : row;
        const rankIdx = flipped ? ri : 7 - ri; // 0..7 => rank1..8
        return cols.map((piece, ci) => {
          const fileIdx = flipped ? 7 - ci : ci;
          const square = FILES[fileIdx] + (rankIdx + 1);
          const light = (fileIdx + rankIdx) % 2 === 1;
          const isSel = selected === square;
          const isHl = highlights.includes(square);
          const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
          const isCheck = checkSquare === square;
          const glyph = piece ? GLYPH[piece.color + piece.type] : '';
          return (
            <button
              key={square}
              type="button"
              onClick={interactive && onSquarePress ? () => onSquarePress(square) : undefined}
              className="relative flex items-center justify-center"
              style={{
                background: isCheck ? '#e2705f' : light ? '#EAD9B0' : '#9B7A4A',
                cursor: interactive && onSquarePress && (glyph || isHl) ? 'pointer' : 'default',
              }}
              aria-label={square}
            >
              {isLast && !isCheck && (
                <span className="pointer-events-none absolute inset-0" style={{ background: light ? 'rgba(31,182,196,0.28)' : 'rgba(31,182,196,0.34)' }} />
              )}
              {isSel && <span className="pointer-events-none absolute inset-0" style={{ background: 'rgba(91,75,224,0.35)' }} />}
              {glyph && (
                <span
                  className="pointer-events-none relative leading-none"
                  style={{
                    fontSize: 'clamp(20px, 8.5cqw, 46px)',
                    color: piece!.color === 'w' ? '#FBFAF6' : '#26221C',
                    textShadow: piece!.color === 'w' ? '0 1.5px 1px rgba(0,0,0,0.35)' : '0 1px 1px rgba(255,255,255,0.18)',
                  }}
                >
                  {glyph}
                </span>
              )}
              {isHl && !glyph && (
                <span className="pointer-events-none absolute" style={{ width: '30%', height: '30%', borderRadius: '9999px', background: 'rgba(23,49,58,0.28)' }} />
              )}
              {isHl && glyph && (
                <span className="pointer-events-none absolute inset-[6%] rounded-full" style={{ boxShadow: 'inset 0 0 0 3px rgba(23,49,58,0.35)' }} />
              )}
              {coords && ci === (flipped ? 7 : 0) && (
                <span className="pointer-events-none absolute left-1 top-0.5 font-mono text-[9px] font-semibold" style={{ color: light ? '#9B7A4A' : '#EAD9B0' }}>
                  {rankIdx + 1}
                </span>
              )}
              {coords && ri === 7 && (
                <span className="pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] font-semibold" style={{ color: light ? '#9B7A4A' : '#EAD9B0' }}>
                  {FILES[fileIdx]}
                </span>
              )}
            </button>
          );
        });
      })}
    </div>
  );
}
