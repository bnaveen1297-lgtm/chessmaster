/**
 * Per-user solved counts for each curriculum pack. The running count lives in
 * localStorage (a lightweight per-device convenience for the progress bar);
 * pack *completion* is recorded in the synced progress.lessons_completed set so
 * it follows the account across devices.
 */
const BASE = 'chesshub360.puzzlepacks';
const keyFor = (uid?: string | null) => (uid ? `${BASE}.${uid}` : BASE);

type Counts = Record<string, number>;

export function readPackCounts(uid?: string | null): Counts {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (raw) return JSON.parse(raw) as Counts;
  } catch {
    /* ignore */
  }
  return {};
}

export function packSolvedCount(uid: string | null | undefined, packId: string): number {
  return readPackCounts(uid)[packId] ?? 0;
}

/** Increment and persist a pack's solved count; returns the new total. */
export function bumpPackSolved(uid: string | null | undefined, packId: string): number {
  const counts = readPackCounts(uid);
  const next = (counts[packId] ?? 0) + 1;
  counts[packId] = next;
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(counts));
  } catch {
    /* ignore */
  }
  return next;
}
