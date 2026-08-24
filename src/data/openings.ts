/**
 * A small opening book (ECO codes + main lines). Structure and naming follow
 * the public-domain `lichess/chess-openings` dataset (CC0); FENs here are
 * generated and verified with chess.js. Scale up by importing the full TSV.
 */

export type Opening = {
  eco: string;
  name: string;
  /** Main line in SAN. */
  moves: string[];
  /** Position after the line (verified). */
  fen: string;
  idea: string;
};

export const openings: Opening[] = [
  { eco: 'C20', name: "King's Pawn Game", moves: ['e4', 'e5'], fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', idea: 'The classical open game — rapid development and central play.' },
  { eco: 'C60', name: 'Ruy López', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', idea: 'Pressure the knight defending e5; long-term pressure and space.' },
  { eco: 'C50', name: 'Italian Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3', idea: 'Target f7 and develop quickly toward the center.' },
  { eco: 'C42', name: 'Petrov Defense', moves: ['e4', 'e5', 'Nf3', 'Nf6'], fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', idea: 'Counterattack in the center instead of defending e5.' },
  { eco: 'B20', name: 'Sicilian Defense', moves: ['e4', 'c5'], fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', idea: 'Fight for the center asymmetrically; sharp winning chances for Black.' },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: ['e4', 'c6'], fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', idea: 'Solid; prepare d5 with a sound pawn structure.' },
  { eco: 'C00', name: 'French Defense', moves: ['e4', 'e6'], fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', idea: 'Solid center with d5; a strong pawn chain.' },
  { eco: 'D06', name: "Queen's Gambit", moves: ['d4', 'd5', 'c4'], fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2', idea: 'Offer a pawn to deflect Black and dominate the center.' },
  { eco: 'E60', name: "King's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'g6'], fen: 'rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3', idea: 'Let White build a big center, then strike back with e5/f5.' },
  { eco: 'A10', name: 'English Opening', moves: ['c4'], fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1', idea: 'Fight for d5 from the flank; flexible structures.' },
  { eco: 'A04', name: 'Réti Opening', moves: ['Nf3'], fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1', idea: 'Flexible flank development; control the center from afar.' },
  { eco: 'A45', name: 'Indian Defense', moves: ['d4', 'Nf6'], fen: 'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 2 2', idea: 'Flexible development before committing the center.' },
];
