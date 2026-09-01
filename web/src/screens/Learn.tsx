import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Group, Row } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { usePrefs, levelUnitLimit } from '@/game/prefs';
import { curriculum, orderedLessonIds } from '@shared/data/content';

export function Learn() {
  const nav = useNavigate();
  const { progress } = useProgress();
  const { prefs } = usePrefs();
  const done = new Set(progress.lessonsCompleted);
  const total = orderedLessonIds.length;
  const [showAll, setShowAll] = useState(false);
  const limit = levelUnitLimit(prefs.level);
  const visible = showAll ? curriculum : curriculum.slice(0, limit);
  const hiddenCount = curriculum.length - visible.length;

  return (
    <div>
      <PageHeader eyebrow={`Learn · ${prefs.level} track`} title="Chess, from zero to sharp"
        sub={`${done.size} of ${total} lessons complete · showing your ${prefs.level.toLowerCase()} level`} />
      <div className="space-y-6">
        {visible.map((unit, ui) => (
          <div key={unit.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-ink font-mono text-[11px] font-bold text-white">{ui + 1}</span>
              <h2 className="font-display text-lg font-black">{unit.title}</h2>
            </div>
            <Group>
              {unit.lessons.map((l) => {
                const isDone = done.has(l.id);
                return (
                  <Row key={l.id} onClick={() => nav(`/app/learn/${l.id}`)}
                    title={l.title} subtitle={`${l.minutes} min${isDone ? ' · completed' : ''}`}
                    left={
                      <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-bold ${isDone ? 'bg-success text-white' : 'bg-plaster-2 text-ink-soft'}`}>
                        {isDone ? '✓' : l.id.replace('l', '')}
                      </span>
                    } />
                );
              })}
            </Group>
          </div>
        ))}
      </div>
      {(hiddenCount > 0 || showAll) && (
        <button onClick={() => setShowAll((s) => !s)} className="btn-ghost mt-6 w-full">
          {showAll ? 'Show only my level' : `Show all levels (${hiddenCount} more unit${hiddenCount === 1 ? '' : 's'})`}
        </button>
      )}
    </div>
  );
}
