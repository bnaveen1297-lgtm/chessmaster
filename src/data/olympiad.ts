/**
 * 46th FIDE Chess Olympiad — Samarkand, Uzbekistan, 15–27 September 2026.
 *
 * Facts verified against FIDE's announcement (chessolympiad2026.fide.com):
 * host Samarkand; venue Silk Road International Exhibition Center; Open + Women
 * sections; 11-round Swiss; teams of four players plus one reserve.
 *
 * Team rosters below list well-known players from each federation as likely
 * contenders — squads are confirmed close to the event, so treat these as
 * "stars to watch," not official line-ups. Live boards will be broadcast by
 * FIDE during the event; in the app we feature verified master games to
 * watch and play (see the Master Base).
 */

export const OLYMPIAD = {
  edition: '46th FIDE Chess Olympiad',
  city: 'Samarkand',
  country: 'Uzbekistan',
  venue: 'Silk Road International Exhibition Center',
  startISO: '2026-09-15T00:00:00',
  endISO: '2026-09-27T23:59:59',
  rounds: 11,
  format: 'Swiss · teams of 4 + 1 reserve',
  sections: 'Open & Women',
  organizer: 'FIDE',
  tagline: 'The world plays in Samarkand',
} as const;

export type OlympiadTeam = {
  code: string; // 3-letter federation code
  country: string;
  stars: string[];
  host?: boolean;
  defending?: boolean;
};

// Strong federations and their star players (contenders to watch).
export const olympiadTeams: OlympiadTeam[] = [
  { code: 'UZB', country: 'Uzbekistan', stars: ['Abdusattorov', 'Sindarov', 'Yakubboev', 'Vokhidov'], host: true, defending: true },
  { code: 'IND', country: 'India', stars: ['Gukesh', 'Erigaisi', 'Praggnanandhaa', 'Vidit'] },
  { code: 'USA', country: 'United States', stars: ['Caruana', 'So', 'Dominguez', 'Sevian'] },
  { code: 'CHN', country: 'China', stars: ['Ding Liren', 'Wei Yi', 'Yu Yangyi', 'Bu Xiangzhi'] },
  { code: 'NOR', country: 'Norway', stars: ['Carlsen', 'Tari', 'Hammer'] },
  { code: 'AZE', country: 'Azerbaijan', stars: ['Mamedyarov', 'Radjabov', 'Naiditsch'] },
  { code: 'FRA', country: 'France', stars: ['Vachier-Lagrave', 'Bacrot', 'Fressinet'] },
  { code: 'ARM', country: 'Armenia', stars: ['Sargissian', 'Ter-Sahakyan', 'Martirosyan'] },
];

/** Days until the opening ceremony (>=0), computed at call time. */
export function daysUntilOlympiad(now: Date = new Date()): number {
  const start = new Date(OLYMPIAD.startISO);
  const ms = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** 'upcoming' | 'live' | 'finished' relative to the event window. */
export function olympiadPhase(now: Date = new Date()): 'upcoming' | 'live' | 'finished' {
  const t = now.getTime();
  if (t < new Date(OLYMPIAD.startISO).getTime()) return 'upcoming';
  if (t > new Date(OLYMPIAD.endISO).getTime()) return 'finished';
  return 'live';
}

export const olympiadDates = '15–27 September 2026';
