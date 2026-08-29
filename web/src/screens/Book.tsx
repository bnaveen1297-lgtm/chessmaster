import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { BackLink } from '@/components/ui';
import { bookById } from '@/data/books';
import { masterGames } from '@shared/data/masters';

export function Book() {
  const { bookId = '' } = useParams();
  const nav = useNavigate();
  const book = bookById(bookId);
  const [chapterIdx, setChapterIdx] = useState(0);

  if (!book) return <div className="mx-auto max-w-2xl"><BackLink to="/app/books" label="Study books" /><p className="mt-4">Book not found.</p></div>;

  const chapter = book.chapters[chapterIdx];
  const game = masterGames.find((g) => g.id === chapter.gameId);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/app/books" label="Study books" />
      <h1 className="font-display text-2xl font-black">{book.title}</h1>
      <p className="mb-4 text-sm text-ink-soft">{book.era} · {book.blurb}</p>

      {/* chapter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {book.chapters.map((c, i) => (
          <button key={c.gameId} onClick={() => setChapterIdx(i)}
            className={`chip ${i === chapterIdx ? 'bg-ink text-white' : 'bg-plaster-2 text-ink-soft'}`}>{i + 1}. {c.title}</button>
        ))}
      </div>

      {game ? (
        <ChapterReader key={chapter.gameId} pgn={game.pgn} title={chapter.title}
          subtitle={`${game.white} – ${game.black}${game.year ? `, ${game.year}` : ''}`}
          notes={chapter.notes}
          onPlay={() => nav(`/app/masters/${game.id}`)} />
      ) : (
        <p className="text-ink-soft">This chapter’s game isn’t available.</p>
      )}
    </div>
  );
}

function ChapterReader({ pgn, title, subtitle, notes, onPlay }: { pgn: string; title: string; subtitle: string; notes: string[]; onPlay: () => void }) {
  const moves = useMemo(() => {
    const c = new Chess();
    try { c.loadPgn(pgn); } catch { return []; }
    return c.history({ verbose: true }) as any[];
  }, [pgn]);
  const positions = useMemo(() => {
    const c = new Chess(); const arr = [c.fen()];
    for (const m of moves) { c.move(m.san); arr.push(c.fen()); }
    return arr;
  }, [moves]);

  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (ply >= moves.length) { setPlaying(false); return; }
    const t = setTimeout(() => setPly((p) => Math.min(p + 1, moves.length)), 800);
    return () => clearTimeout(t);
  }, [playing, ply, moves.length]);
  const last = ply > 0 ? moves[ply - 1] : null;

  return (
    <div>
      <div className="mb-2"><div className="font-display text-lg font-black">{title}</div><div className="text-[13px] text-ink-faint">{subtitle}</div></div>
      <Board fen={positions[ply]} interactive={false} lastMove={last ? { from: last.from, to: last.to } : null} />
      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => { setPlaying(false); setPly(0); }} className="btn-ghost px-4 py-2">⏮</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.max(0, p - 1)); }} className="btn-ghost px-4 py-2">‹</button>
        <button onClick={() => setPlaying((p) => !p)} className="btn-dark px-6 py-2">{playing ? '❚❚' : '▶ Play'}</button>
        <button onClick={() => { setPlaying(false); setPly((p) => Math.min(moves.length, p + 1)); }} className="btn-ghost px-4 py-2">›</button>
        <button onClick={() => { setPlaying(false); setPly(moves.length); }} className="btn-ghost px-4 py-2">⏭</button>
      </div>
      <div className="mt-2 text-center font-mono text-sm text-ink-faint">Move {Math.ceil(ply / 2)} / {Math.ceil(moves.length / 2)} {last ? `· ${last.san}` : ''}</div>

      <div className="mt-5 rounded-2xl border border-line bg-plaster-2 p-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">Key ideas</div>
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-[14px]"><span className="font-bold text-teal">{i + 1}.</span><span>{n}</span></li>
          ))}
        </ul>
        <button onClick={onPlay} className="btn-primary mt-4 w-full">Open in Master Base — play or review</button>
      </div>
    </div>
  );
}
