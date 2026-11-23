import { Link } from 'react-router-dom';
import Headline from '../components/Headline';
import Marquee from '../components/Marquee';
import Reveal from '../components/Reveal';
import { content } from '../content';
import { useStore } from '../lib/store';

export default function Home() {
  const match = useStore((s) => s.match);
  const h = content.home;
  return (
    <div className="grid gap-10 pt-6">
      <div>
        <Headline line1={h.title1} line2={h.title2} />
        <p className="mt-8 max-w-xl text-xl font-medium">{h.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {match && (
            <Link to="/match" className="btn btn-accent text-lg">
              {h.resume}: {match.setup.teams[0].name} vs {match.setup.teams[1].name}
            </Link>
          )}
          <Link to="/new" className="btn btn-ink text-lg">
            {h.newMatch}
          </Link>
          <Link to="/stats" className="btn text-lg">
            {h.stats}
          </Link>
        </div>
      </div>

      <Marquee items={content.ticker} />

      <div className="grid gap-4 sm:grid-cols-3">
        {h.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="card h-full transition hover:-translate-y-1 hover:rotate-1 hover:shadow-[8px_8px_0_0_var(--ink)]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-accent font-extrabold text-black">
                {i + 1}
              </span>
              <p className="mt-3 text-2xl font-extrabold">{f.title}</p>
              <p className="mt-1 text-muted">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}