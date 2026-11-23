import type { ReactNode } from 'react';

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Row of toggle buttons where exactly one is selected. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border-2 border-ink px-3 py-2 font-bold transition ${
              active ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-accent hover:text-black'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border-2 border-ink p-3 text-left"
    >
      <span>
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={`h-7 w-12 shrink-0 rounded-full border-2 border-ink p-0.5 transition ${
          checked ? 'bg-accent' : 'bg-paper'
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-ink transition ${checked ? 'translate-x-5' : ''}`}
        />
      </span>
    </button>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-5 text-sm font-extrabold uppercase tracking-wide text-muted">{children}</p>;
}