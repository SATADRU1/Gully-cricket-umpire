/** Scrolling ticker strip. The list is doubled so the loop has no jump. */
export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-ink bg-ink py-2 text-paper"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max whitespace-nowrap text-lg font-extrabold uppercase">
        {row.map((t, i) => (
          <span key={i} className="pr-6">
            {t} <span className="text-accent dark:text-black">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}    