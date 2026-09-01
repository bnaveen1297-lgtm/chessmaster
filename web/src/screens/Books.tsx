import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { books } from '@/data/books';

export function Books() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Library" title="Study books"
        sub="Curated collections of famous, public-domain games — read the ideas, then play through every move." />
      <div className="grid gap-4 sm:grid-cols-2">
        {books.map((b) => (
          <button key={b.id} onClick={() => nav(`/app/books/${b.id}`)} className="card p-5 text-left transition hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-xl text-white">📖</span>
              <span className="rounded-full bg-plaster-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{b.era}</span>
            </div>
            <div className="mt-3 font-display text-lg font-black">{b.title}</div>
            <div className="text-[13px] text-ink-soft">{b.blurb}</div>
            <div className="mt-2 text-[12px] font-semibold text-teal">{b.chapters.length} chapters ›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
