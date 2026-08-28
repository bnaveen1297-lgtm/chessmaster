import { useNavigate } from 'react-router-dom';
import { PageHeader, Group, Row } from '@/components/ui';
import { useProgress } from '@/game/progress';
import { curriculum, orderedLessonIds } from '@shared/data/content';

export function Learn() {
  const nav = useNavigate();
  const { progress } = useProgress();
  const done = new Set(progress.lessonsCompleted);
  const total = orderedLessonIds.length;

  return (
    <div>
      <PageHeader eyebrow="Learn · the course" title="Chess, from zero to sharp"
        sub={`${done.size} of ${total} lessons complete · ${curriculum.length} units`} />
      <div className="space-y-6">
        {curriculum.map((unit, ui) => (
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
    </div>
  );
}
