/**
 * Study "books": curated collections of famous, public-domain master games with
 * short teaching notes. Each chapter points at a game in the Master Base (whose
 * PGNs are already verified) so there is no new game data to get wrong — the
 * book adds the narrative and the ideas to study.
 */
export type BookChapter = {
  gameId: string;   // id in src/data/masters.ts
  title: string;
  notes: string[];  // a few teaching points shown alongside the board
};

export type Book = {
  id: string;
  title: string;
  era: string;
  blurb: string;
  chapters: BookChapter[];
};

export const books: Book[] = [
  {
    id: 'romantics',
    title: 'The Romantic Era',
    era: '1850s',
    blurb: 'Chess when attack was everything — gambits, open lines, and fearless sacrifices to hunt the king.',
    chapters: [
      {
        gameId: 'opera-1858', title: 'Morphy at the Opera',
        notes: [
          'Morphy develops every piece toward the centre and the enemy king — nothing is wasted.',
          'He gives up material to open lines: development and initiative are worth more than a pawn or a piece here.',
          'The finish is a model of coordination — rook and bishop deliver mate because Black never caught up in development.',
        ],
      },
      {
        gameId: 'immortal-1851', title: 'The Immortal Game',
        notes: [
          'Anderssen sacrifices a bishop, both rooks and the queen — and still mates with his three minor pieces.',
          'The lesson isn’t the sacrifices themselves but why they work: every one removes a defender or opens a line.',
          'Count the attackers vs defenders around the king before you believe a sacrifice.',
        ],
      },
      {
        gameId: 'evergreen-1852', title: 'The Evergreen Game',
        notes: [
          'A cleaner, more “correct” masterpiece than the Immortal — the attack flows from sound development.',
          'Watch how a single tempo (a check, a threat) keeps the initiative from slipping away.',
          'The mating net is built one forcing move at a time.',
        ],
      },
    ],
  },
  {
    id: 'combinations',
    title: 'Immortal Combinations',
    era: '1889–1910',
    blurb: 'Three of the most instructive sacrifices ever played — patterns you will reuse for a lifetime.',
    chapters: [
      {
        gameId: 'lasker-bauer-1889', title: 'The Double Bishop Sacrifice',
        notes: [
          'Both bishops are given up to strip the pawns in front of the castled king.',
          'The queen and rook then invade the exposed king — this exact pattern recurs in thousands of games.',
          'Remember the trigger: two bishops aimed at h7/g7 (or h2/g2) with a queen ready to follow.',
        ],
      },
      {
        gameId: 'rubinstein-1907', title: 'Rubinstein’s Immortal',
        notes: [
          'A cascade of sacrifices on the kingside, each justified by concrete threats.',
          'Rubinstein’s pieces all point at the same target — coordination beats material.',
          'Try to find each move before revealing it; the line is forcing.',
        ],
      },
      {
        gameId: 'reti-tartakower-1910', title: 'A Miniature Masterpiece',
        notes: [
          'A short, sharp game showing how quickly a lag in development is punished.',
          'The queen sacrifice sets up a forced mate — look for the checks that leave the king no escape.',
        ],
      },
    ],
  },
  {
    id: 'moderns',
    title: 'Champions of the Modern Age',
    era: '1956–1999',
    blurb: 'From a 13-year-old Fischer to Kasparov’s deepest combination — modern classics to learn from.',
    chapters: [
      {
        gameId: 'century-1956', title: 'The Game of the Century',
        notes: [
          'A 13-year-old Bobby Fischer plays a stunning queen sacrifice for a winning attack.',
          'Notice the windmill of discovered checks that harvests material.',
          'Deep calculation, but built on a simple idea: activity over material.',
        ],
      },
      {
        gameId: 'fischer-spassky-1972-g6', title: 'Fischer’s Finest',
        notes: [
          'From the 1972 World Championship — Fischer plays with crystalline clarity.',
          'Small positional gains accumulate into a decisive advantage; no fireworks needed.',
          'A model of converting a strategic edge.',
        ],
      },
      {
        gameId: 'kasparov-topalov-1999', title: 'Kasparov’s Immortal',
        notes: [
          'One of the deepest combinations in tournament history — a king hunt across the whole board.',
          'Kasparov sacrifices a rook to drag the king into the open and calculates the rest to mate.',
          'Play through slowly; each “quiet” move is doing real work.',
        ],
      },
    ],
  },
];

export function bookById(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
