/**
 * Load a big PGN collection of master games into Supabase (public.master_games).
 *
 * Reads a PGN stream from stdin and streams games into Supabase in batches, so
 * memory stays flat for multi-GB files. Good free sources of master games:
 *   - Lichess Elite database (2400+ vs 2200+):  https://database.nikonoel.fr/
 *   - Caissabase / KingBase (millions of OTB master games, PGN)
 *
 * Usage (from a machine with network + your Supabase service key):
 *
 *   export SUPABASE_URL="https://<ref>.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="<service-role key>"
 *   # a .pgn file:
 *   cat games.pgn | node scripts/import-pgn-games.mjs
 *   # or a zstd/zip stream:
 *   zstd -dc lichess_elite_2024-12.pgn.zst | node scripts/import-pgn-games.mjs
 *
 * Optional env: LIMIT (max games), MIN_ELO (both players), BATCH (default 500).
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
const MIN_ELO = process.env.MIN_ELO ? parseInt(process.env.MIN_ELO, 10) : 0;
const BATCH = process.env.BATCH ? parseInt(process.env.BATCH, 10) : 500;
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

function tag(block, name) {
  const m = block.match(new RegExp(`\\[${name}\\s+"([^"]*)"\\]`));
  return m ? m[1] : null;
}
function elo(v) {
  const n = parseInt(v || '', 10);
  return Number.isNaN(n) ? null : n;
}
function toRow(block) {
  if (!/\[Event\s/.test(block)) return null;
  const white = tag(block, 'White');
  const black = tag(block, 'Black');
  const result = tag(block, 'Result');
  const wElo = elo(tag(block, 'WhiteElo'));
  const bElo = elo(tag(block, 'BlackElo'));
  if (MIN_ELO && (!(wElo >= MIN_ELO) || !(bElo >= MIN_ELO))) return null;
  // movetext = lines that don't start with '['
  const moveText = block.split('\n').filter((l) => l && !l.startsWith('[')).join(' ').trim();
  if (!moveText) return null;
  const ply = (moveText.match(/\b\d+\.(\.\.)?/g) || []).length; // rough
  return {
    white,
    black,
    result: result && ['1-0', '0-1', '1/2-1/2'].includes(result) ? result : null,
    event: tag(block, 'Event'),
    site: tag(block, 'Site'),
    game_date: tag(block, 'Date'),
    white_elo: wElo,
    black_elo: bElo,
    eco: tag(block, 'ECO'),
    opening: tag(block, 'Opening'),
    ply,
    pgn: block.trim(),
  };
}

async function flush(batch) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from('master_games').insert(batch);
    if (!error) return;
    console.error(`  insert failed (try ${attempt}): ${error.message}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  console.error('  skipping this batch, continuing…');
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let block = '';
let sawMoves = false;
let batch = [];
let total = 0;
const started = Date.now();

async function pushBlock() {
  const row = toRow(block);
  block = '';
  sawMoves = false;
  if (!row) return false;
  batch.push(row);
  if (batch.length >= BATCH) {
    await flush(batch);
    total += batch.length;
    batch = [];
    if (total % 20000 === 0) {
      const rate = Math.round(total / ((Date.now() - started) / 1000));
      console.log(`  ${total.toLocaleString()} games… (${rate}/s)`);
    }
  }
  return true;
}

for await (const line of rl) {
  // A new game starts when we hit an [Event after having seen movetext.
  if (line.startsWith('[Event ') && sawMoves) {
    await pushBlock();
    if (total >= LIMIT) break;
  }
  if (line && !line.startsWith('[')) sawMoves = true;
  block += line + '\n';
}
if (block.trim() && total < LIMIT) await pushBlock();
if (batch.length) { await flush(batch); total += batch.length; }

console.log(`\nDone: ${total.toLocaleString()} master games imported.`);
process.exit(0);
