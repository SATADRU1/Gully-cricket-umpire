import type { ExtraType } from '@gully/core';
import Sheet from '../Sheet';

const CONFIG: Record<ExtraType, { title: string; hint: string; options: number[] }> = {
  wide: { title: 'Wide', hint: 'Extra runs run, besides the wide penalty', options: [0, 1, 2, 3, 4] },
  noball: { title: 'No ball', hint: 'Runs off the bat', options: [0, 1, 2, 3, 4, 6] },
  bye: { title: 'Byes', hint: 'Runs run', options: [1, 2, 3, 4] },
  legbye: { title: 'Leg byes', hint: 'Runs run', options: [1, 2, 3, 4] },
};

interface Props {
  type: ExtraType | null;
  onPick: (runs: number) => void;
  onClose: () => void;
}

export default function ExtraSheet({ type, onPick, onClose }: Props) {
  const c = type ? CONFIG[type] : null;
  return (
    <Sheet open={type !== null} title={c?.title ?? ''} onClose={onClose}>
      {c && (
        <>
          <p className="mb-3 font-medium text-muted">{c.hint}</p>
          <div className="grid grid-cols-3 gap-3">
            {c.options.map((n) => (
              <button key={n} className="btn h-16 text-3xl" onClick={() => onPick(n)}>
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}