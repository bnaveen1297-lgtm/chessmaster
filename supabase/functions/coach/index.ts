// chesshub360 AI Coach — a conversational chess coach powered by Claude.
//
// The Anthropic API key lives ONLY here, as a Supabase secret (ANTHROPIC_API_KEY),
// never in the browser. verify_jwt is on, so only signed-in users can call it.
// The client sends the chat history + a small context blob (level, weakness
// profile, stats); this builds the system prompt and forwards to Claude.
import { cors, json, err } from '../_shared/cors.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function buildSystem(ctx: any): string {
  const level = ctx?.level ? String(ctx.level) : 'unknown';
  const p = ctx?.profile;
  const stats = ctx?.stats;
  const lines = [
    'You are a warm, encouraging chess coach inside the chesshub360 app.',
    'Give specific, actionable advice in plain language a club player understands.',
    'Keep replies short — 2–5 sentences — unless the player asks for a full plan or a move-by-move explanation.',
    'When you name a concrete next step, point to app features: puzzles by topic, Tactics Rush, the game analyzer, lessons, or playing the Grandmaster bot.',
    'Only discuss chess and the player’s improvement. If asked something off-topic, gently steer back.',
    `The player describes their level as: ${level}.`,
  ];
  if (p && p.games) {
    lines.push(
      `From ${p.games} of their real games: ${p.avgAccuracy}% average accuracy, ` +
      `weakest phase = ${p.worstPhase ?? 'n/a'}, most common error = ${p.dominantError ?? 'n/a'}, ` +
      `${p.blundersPerGame ?? '?'} blunders per game, weaker with ${p.weakerColor ?? 'neither colour'}.`,
    );
  }
  if (stats) {
    lines.push(`In-app: ${stats.puzzlesSolved ?? 0} puzzles solved, ${stats.gamesPlayed ?? 0} games played, level ${stats.level ?? 1}.`);
  }
  return lines.join(' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return err('POST only', 405);

  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return err('The AI coach isn’t set up yet — add ANTHROPIC_API_KEY in Supabase secrets.', 503);

  let body: any;
  try { body = await req.json(); } catch { return err('Invalid JSON body.'); }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) return err('messages required.');

  // Sanitise: keep the last 16 turns, clamp size, force valid roles.
  const safe = messages.slice(-16).map((m: any) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: String(m?.content ?? '').slice(0, 4000),
  })).filter((m: any) => m.content);
  if (!safe.length || safe[0].role !== 'user') return err('The conversation must start with a user message.');

  const model = Deno.env.get('COACH_MODEL') || 'claude-opus-5';
  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1024, system: buildSystem(body?.context), messages: safe }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('coach upstream', r.status, t.slice(0, 300));
      return err(`The coach couldn’t respond (upstream ${r.status}).`, 502);
    }
    const data = await r.json();
    const text = (data?.content ?? []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('\n').trim();
    return json({ text: text || 'I’m not sure how to answer that — try rephrasing?' });
  } catch (e) {
    console.error('coach error', String(e));
    return err('The coach is temporarily unavailable. Try again in a moment.', 502);
  }
});
