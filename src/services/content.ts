/**
 * Content service — the single seam between the UI and the data source.
 *
 * Every screen should read data through these functions. Today they resolve
 * local placeholder content; when the backend is live, each function swaps to
 * an `apiGet(...)` call and nothing in the UI has to change.
 */
import { hasBackend, apiGet } from './api';
import {
  liveGames,
  curriculum,
  puzzles,
  openTournaments,
  type LiveGame,
  type CurriculumUnit,
  type Puzzle,
  type OpenTournament,
} from '../data/content';

export async function getLiveGames(): Promise<LiveGame[]> {
  if (hasBackend) return apiGet<LiveGame[]>('/olympiad/live');
  return liveGames;
}

export async function getCurriculum(): Promise<CurriculumUnit[]> {
  if (hasBackend) return apiGet<CurriculumUnit[]>('/curriculum');
  return curriculum;
}

export async function getPuzzles(): Promise<Puzzle[]> {
  if (hasBackend) return apiGet<Puzzle[]>('/puzzles');
  return puzzles;
}

export async function getOpenTournaments(): Promise<OpenTournament[]> {
  if (hasBackend) return apiGet<OpenTournament[]>('/tournaments/open');
  return openTournaments;
}
