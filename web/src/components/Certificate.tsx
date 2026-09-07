/**
 * A shareable chesshub360 certificate of achievement, printed from the graded
 * puzzle exam. Print-friendly (window.print) and screenshot-friendly.
 */
export type ExamGrade = { title: string; blurb: string; certified: boolean };

export function gradeFor(pct: number): ExamGrade {
  if (pct >= 85) return { title: 'Advanced', blurb: 'tournament-ready tactical vision', certified: true };
  if (pct >= 70) return { title: 'Intermediate', blurb: 'strong, reliable tactical skill', certified: true };
  if (pct >= 50) return { title: 'Beginner', blurb: 'a solid grasp of the core tactics', certified: true };
  return { title: 'Novice', blurb: 'a promising start — keep training', certified: false };
}

/** Short deterministic verification id from the certificate's facts. */
export function verifyId(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function Certificate({ name, pct, correct, total, date }: { name: string; pct: number; correct: number; total: number; date: string }) {
  const g = gradeFor(pct);
  const id = verifyId(`${name}|${date}|${correct}/${total}`);
  return (
    <div className="cert relative overflow-hidden rounded-2xl border-2 border-gold/60 bg-[linear-gradient(135deg,#fffdf5,#f6f1e2)] p-8 text-center text-ink shadow-lift">
      <div className="pointer-events-none absolute -right-10 -top-10 text-[160px] opacity-[0.06]">♞</div>
      <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-ink-faint">chesshub360</div>
      <div className="mt-1 font-display text-2xl font-black">Certificate of Achievement</div>
      <div className="mx-auto mt-4 h-px w-24 bg-gold/60" />
      <div className="mt-4 text-[13px] text-ink-soft">This certifies that</div>
      <div className="mt-1 font-display text-3xl font-black">{name || 'Chess Player'}</div>
      <div className="mt-3 text-[14px] text-ink-soft">
        has completed the chesshub360 tactics exam at
      </div>
      <div className="mt-1 font-display text-xl font-black text-teal">{g.title} level</div>
      <div className="text-[13px] text-ink-soft">demonstrating {g.blurb}.</div>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3">
        <Stat label="Score" value={`${pct}%`} />
        <Stat label="Solved" value={`${correct}/${total}`} />
        <Stat label="Result" value={g.certified ? 'Certified' : 'Keep going'} />
      </div>

      <div className="mt-6 flex items-end justify-between text-left">
        <div>
          <div className="font-signature text-xl italic" style={{ fontFamily: 'Georgia, serif' }}>chesshub360</div>
          <div className="border-t border-line pt-1 text-[11px] uppercase tracking-wide text-ink-faint">Issued {date}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-ink-faint">No. {id}</div>
          <div className="border-t border-line pt-1 text-[11px] uppercase tracking-wide text-ink-faint">Verification</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/60 p-3">
      <div className="font-display text-lg font-black">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}
