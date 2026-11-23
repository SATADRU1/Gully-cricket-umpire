import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { aggregatePlayers, seasonHero } from '@gully/core';
import type { PlayerStats } from '@gully/core';
import AboutCard from '../components/AboutCard';
import Headline from '../components/Headline';
import Marquee from '../components/Marquee';
import Reveal from '../components/Reveal';
import { content } from '../content';
import { db } from '../lib/db';

const f1 = (n: number | null) => (n === null ? '–' : n.toFixed(1));

function Bar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-ink">
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(pct, 4)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; value: number; note: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Reveal>
      <section className="card h-full">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <div className="mt-4 grid gap-4">
          {rows.length === 0 && <p className="text-muted">Nobody yet.</p>}
          {rows.map((r, i) => (
            <div key={r.name}>
              <div className="flex items-baseline justify-between">
                <p className="font-bold">
                  <span className="mr-2 text-muted">{i + 1}</span>
                  {r.name}
                </p>
                <p className="text-xl font-extrabold">
                  {r.value} <span className="text-sm font-medium text-muted">{r.note}</span>
                </p>
              </div>
              <Bar pct={(r.value / max) * 100} />
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function PlayerCard({ p }: { p: PlayerStats }) {
  return (
    <div className="card transition hover:-translate-y-1 hover:rotate-1 hover:shadow-[6px_6px_0_0_var(--ink)]">
      <p className="text-2xl font-extrabold">{p.name}</p>
      <p className="text-sm text-muted">
        {p.matches} match{p.matches === 1 ? '' : 'es'}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-extrabold">{p.runs}</p>
          <p className="text-xs font-bold uppercase text-muted">Runs</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{p.strikeRate.toFixed(0)}</p>
          <p className="text-xs font-bold uppercase text-muted">SR</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{f1(p.average)}</p>
          <p className="text-xs font-bold uppercase text-muted">Avg</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{p.wickets}</p>
          <p className="text-xs font-bold uppercase text-muted">Wkts</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{f1(p.economy)}</p>
          <p className="text-xs font-bold uppercase text-muted">Econ</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{p.highScore}</p>
          <p className="text-xs font-bold uppercase text-muted">Best</p>
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const matches = useLiveQuery(() => db.matches.orderBy('playedAt').reverse().toArray(), []);

  const players = useMemo(
    () =>
      matches
        ? aggregatePlayers(
            matches.flatMap((m) =>
              m.innings.map((i) => ({ matchId: m.id, config: i.config, events: i.events })),
            ),
          )
        : [],
    [matches],
  );
  const hero = useMemo(() => seasonHero(players), [players]);

  const batters = [...players]
    .filter((p) => p.battingInnings > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5)
    .map((p) => ({ name: p.name, value: p.runs, note: `runs · SR ${p.strikeRate.toFixed(0)}` }));
  const bowlers = [...players]
    .filter((p) => p.legalBalls > 0)
    .sort((a, b) => b.wickets - a.wickets || (a.economy ?? 99) - (b.economy ?? 99))
    .slice(0, 5)
    .map((p) => ({ name: p.name, value: p.wickets, note: `wkts · econ ${f1(p.economy)}` }));

  const totals = {
    matches: matches?.length ?? 0,
    runs: players.reduce((s, p) => s + p.runs, 0),
    wickets: players.reduce((s, p) => s + p.wickets, 0),
    sixes: players.reduce((s, p) => s + p.sixes, 0),
  };

  const s = content.stats;

  return (
    <div className="pt-6">
      <Headline line1={s.title1} line2={s.title2} />
      <p className="mt-8 max-w-xl text-xl font-medium">{s.subtitle}</p>

      <div className="mt-8">
        <Marquee items={content.ticker} />
      </div>

      {matches === undefined && <p className="mt-10 text-muted">Loading…</p>}

      {matches !== undefined && matches.length === 0 && (
        <div className="card mt-10 text-center">
          <p className="text-3xl font-extrabold">{s.emptyTitle}</p>
          <p className="mt-2 text-muted">{s.emptyBody}</p>
          <Link to="/new" className="btn btn-accent mt-5 text-lg">
            {s.emptyButton}
          </Link>
        </div>
      )}

      {matches !== undefined && matches.length > 0 && (
        <div className="mt-10 grid gap-8">
          {hero && (
            <Reveal>
              <section className="rounded-3xl border-2 border-ink bg-accent p-6 text-black transition hover:-rotate-1 hover:shadow-[8px_8px_0_0_var(--ink)]">
                <p className="text-sm font-extrabold uppercase tracking-widest">🏆 {s.heroLabel}</p>
                <p className="mt-2 text-[clamp(3rem,13vw,7rem)] font-extrabold leading-none">
                  {hero.name}
                </p>
                <p className="mt-3 text-2xl font-bold">
                  {hero.runs} runs · {hero.wickets} wickets · {hero.impact} pts
                </p>
                <p className="mt-1 text-sm font-semibold opacity-70">{s.heroNote}</p>
              </section>
            </Reveal>
          )}

          <Reveal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['Matches', totals.matches],
                  ['Runs', totals.runs],
                  ['Wickets', totals.wickets],
                  ['Sixes', totals.sixes],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="card text-center">
                  <p className="text-5xl font-extrabold">{value}</p>
                  <p className="text-sm font-bold uppercase text-muted">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            <Leaderboard title={s.battersTitle} rows={batters} />
            <Leaderboard title={s.bowlersTitle} rows={bowlers} />
          </div>

          <Reveal>
            <h2 className="text-4xl font-extrabold">{s.playersTitle}</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p, i) => (
              <Reveal key={p.name} delay={Math.min(i, 5) * 0.05}>
                <PlayerCard p={p} />
              </Reveal>
            ))}
          </div>

          <Reveal>
            <h2 className="text-4xl font-extrabold">{s.matchesTitle}</h2>
          </Reveal>
          <div className="grid gap-3">
            {matches.slice(0, 8).map((m) => (
              <Reveal key={m.id}>
                <div className="card flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xl font-extrabold">
                    {m.teams[0]} vs {m.teams[1]}
                  </p>
                  <p className="font-bold">{m.resultSummary}</p>
                  <p className="w-full text-sm text-muted">
                    {new Date(m.playedAt).toLocaleDateString()}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <Reveal className="mt-16">
        <AboutCard />
      </Reveal>

      <p className="mt-10 text-center text-sm text-muted">{content.footer}</p>
    </div>
  );
}