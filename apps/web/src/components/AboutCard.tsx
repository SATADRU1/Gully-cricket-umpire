import { content } from '../content';

/** Black card in light mode, lime card in dark mode, so the text is always readable. */
export default function AboutCard() {
  const a = content.about;
  return (
    <section className="rounded-3xl border-2 border-ink bg-black p-6 text-white shadow-[6px_6px_0_0_var(--ink)] dark:bg-accent dark:text-black">
      <p className="text-sm font-extrabold uppercase tracking-widest text-accent dark:text-black">
        {a.title}
      </p>
      <p className="mt-2 text-5xl font-extrabold">{a.name}</p>
      <p className="mt-1 text-lg font-bold text-accent dark:text-black">{a.role}</p>
      <p className="mt-4 max-w-xl text-lg">{a.body}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {a.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border-2 border-white px-4 py-2 font-bold transition hover:bg-accent hover:text-black dark:border-black dark:hover:bg-black dark:hover:text-accent"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </section>
  );
}