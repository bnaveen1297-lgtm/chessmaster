/**
 * Load the Lichess puzzle database (CC0, ~5M puzzles) into Supabase.
 *
 * The Lichess dump is a zstd-compressed CSV. This script reads DECOMPRESSED CSV
 * from stdin and bulk-upserts it into public.puzzles in batches, so it streams
 * with a flat memory footprint at any scale.
 *
 * Usage (needs the `zstd` CLI and network on the machine you run it from):
 *
 *   export SUPABASE_URL="https://<ref>.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"        # server key, not the anon key
 *   curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst \
 *     | zstd -d \
 *     | node scripts/import-lichess-puzzles.mjs
 *
 * Optional env: LIMIT (max rows), MIN_RATING, MAX_RATING, BATCH (default 1000).
 * The full set is a few GB in Postgres — on the Supabase free tier import a
 * subset, e.g. LIMIT=1000000 or MIN_RATING=1000 MAX_RATING=2200.
 */
import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;
const MIN = process.env.MIN_RATING ? parseInt(process.env.MIN_RATING, 10) : 0;
const MAX = process.env.MAX_RATING ? parseInt(process.env.MAX_RATING, 10) : 4000;
const BATCH = process.env.BATCH ? parseInt(process.env.BATCH, 10) : 1000;

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

function toRow(line) {
  // No Lichess puzzle field contains a comma, so a plain split is safe.
  const c = line.split(',');
  if (c.length < 8) return null;
  const rating = parseInt(c[3], 10);
  if (!c[0] || !c[1] || !c[2] || Number.isNaN(rating)) return null;
  if (rating < MIN || rating > MAX) return null;
  return {
    id: c[0],
    fen: c[1],
    moves: c[2],
    rating,
    rating_deviation: parseInt(c[4], 10) || null,
    popularity: parseInt(c[5], 10) || null,
    nb_plays: parseInt(c[6], 10) || null,
    themes: c[7] || '',
    game_url: c[8] || null,
    opening_tags: c[9] || null,
  };
}

async function flush(batch) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from('puzzles').upsert(batch, { onConflict: 'id' });
    if (!error) return;
    console.error(`  batch upsert failed (try ${attempt}): ${error.message}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  console.error('  giving up on this batch, continuing…');
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let batch = [];
let total = 0;
let seenHeader = false;
const started = Date.now();

for await (const line of rl) {
  if (!line) continue;
  if (!seenHeader && line.startsWith('PuzzleId')) { seenHeader = true; continue; }
  const row = toRow(line);
  if (!row) continue;
  batch.push(row);
  if (batch.length >= BATCH) {
    await flush(batch);
    total += batch.length;
    batch = [];
    if (total % 50000 === 0) {
      const rate = Math.round(total / ((Date.now() - started) / 1000));
      console.log(`  ${total.toLocaleString()} puzzles… (${rate}/s)`);
    }
    if (total >= LIMIT) break;
  }
}
if (batch.length && total < LIMIT) { await flush(batch); total += batch.length; }

console.log(`\nDone: ${total.toLocaleString()} puzzles imported.`);
process.exit(0);
