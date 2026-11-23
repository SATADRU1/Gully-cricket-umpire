import { useState } from 'react';
import type { ExtraType } from '@gully/core';
import { useStore } from '../../lib/store';
import type { MatchView } from '../../lib/match';
import type { BallInput } from '../../lib/types';
import { uid } from '../../lib/util';
import BowlerSheet from './BowlerSheet';
import ExtraSheet from './ExtraSheet';
import WicketSheet from './WicketSheet';

const RUNS = [0, 1, 2, 3, 4, 6];
const EXTRAS: { type: ExtraType; label: string }[] = [
  { type: 'wide', label: 'Wide' },
  { type: 'noball', label: 'No ball' },
  { type: 'bye', label: 'Bye' },
  { type: 'legbye', label: 'Leg bye' },
];

function chipClass(label: string): string {
  if (label.includes('W') && !label.startsWith('Wd')) return 'bg-hot text-white';
  if (label === '4' || label === '6') return 'bg-accent text-black';
  if (label.startsWith('Wd') || label.startsWith('Nb') || label.startsWith('B') || label.startsWith('Lb'))
    return 'border-dashed bg-paper text-ink';
  return 'bg-paper text-ink';
}

export default function ScoringPanel({ view }: { view: MatchView }) {
  const score = useStore((s) => s.score);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const setBowler = useStore((s) => s.setBowler);
  const endInnings = useStore((s) => s.endInnings);

  const { state, config, record, inningsIndex } = view;
  const [sheet, setSheet] = useState<null | 'wicket' | 'bowler' | ExtraType>(null);
  const [error, setError] = useState<string | null>(null);

  const overIdx = state.completedOvers.length;
  const bowler = record.bowlerByOver[overIdx];
  const needsBowler = !bowler;
  const extraType = sheet === null || sheet === 'wicket' || sheet === 'bowler' ? null : sheet;

  const send = (input: BallInput): string | null => {
    if (!bowler) {
      setSheet('bowler');
      return 'Pick a bowler first';
    }
    const err = score({ type: 'ball', id: uid(), ts: Date.now(), bowler, ...input });
    setError(err);
    return err;
  };

  const pickExtra = (type: ExtraType, n: number) => {
    const input: BallInput =
      type === 'noball' ? { extra: type, batRuns: n } : { extra: type, extraRuns: n };
    if (!send(input)) setSheet(null);
  };

  const submitWicket = (input: BallInput): string | null => {
    const err = send(input);
    if (!err) setSheet(null);
    return err;
  };

  const batterLine = (name: string | null, isStriker: boolean) => {
    if (!name) return null;
    const b = state.batters.find((x) => x.name === name);
    return (
      <div className="flex items-baseline justify-between">
        <p className={`text-lg ${isStriker ? 'font-extrabold' : 'font-semibold'}`}>
          {name}
          {isStriker ? ' *' : ''}
        </p>
        <p className="text-lg font-bold">
          {b?.runs ?? 0} <span className="text-sm font-medium text-muted">({b?.balls ?? 0})</span>
        </p>
      </div>
    );
  };

  const fig = state.bowlers.find((b) => b.name === bowler);
  const bpo = config.rules.ballsPerOver;
  const lastOver = state.completedOvers[state.completedOvers.length - 1];

  return (
    <div className="mx-auto grid max-w-md gap-4">
      {/* scoreboard */}
      <section className="card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted">
              {config.battingTeam.name} · innings {inningsIndex + 1}
            </p>
            <p className="text-7xl font-extrabold leading-none">
              {state.runs}
              <span className="text-4xl text-muted">/{state.wickets}</span>
            </p>
            <p className="mt-2 font-bold">
              {state.overs} / {config.rules.oversPerInnings} ov · RR {state.runRate.toFixed(2)}
            </p>
          </div>
          {state.freeHit && (
            <span className="rounded-full bg-hot px-3 py-1 text-sm font-extrabold text-white">
              FREE HIT
            </span>
          )}
        </div>
        {state.target !== undefined && (
          <p className="mt-3 rounded-xl bg-accent px-3 py-2 font-bold text-black">
            Need {state.runsNeeded} off {state.ballsLeft} balls
            {state.requiredRate !== undefined && ` · RRR ${state.requiredRate.toFixed(2)}`}
          </p>
        )}
      </section>

      {/* batters and bowler */}
      <section className="card grid gap-1">
        {batterLine(state.striker, true)}
        {batterLine(state.nonStriker, false)}
        <div className="mt-2 flex items-center justify-between border-t-2 border-ink pt-2">
          <p className="font-semibold">
            <span className="text-muted">Bowling:</span> {bowler ?? '—'}{' '}
            {fig && (
              <span className="text-sm text-muted">
                {Math.floor(fig.legalBalls / bpo)}.{fig.legalBalls % bpo}-{fig.runs}-{fig.wickets}
              </span>
            )}
          </p>
          <button className="btn px-3 py-1 text-sm" onClick={() => setSheet('bowler')}>
            Change
          </button>
        </div>
      </section>

      {/* this over */}
      <section>
        <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">This over</p>
        <div className="flex min-h-10 flex-wrap gap-2">
          {state.currentOver.length === 0 && <span className="text-muted">New over</span>}
          {state.currentOver.map((b, i) => (
            <span
              key={i}
              className={`rounded-full border-2 border-ink px-3 py-1 font-extrabold ${chipClass(b.label)}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        {lastOver && (
          <p className="mt-2 text-sm text-muted">
            Last over: {lastOver.map((b) => b.label).join(' ')}
          </p>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-hot p-3 font-bold text-white">
          {error}
        </p>
      )}

      {/* run pad */}
      <section className="grid grid-cols-3 gap-3">
        {RUNS.map((r) => (
          <button
            key={r}
            onClick={() => send({ batRuns: r })}
            className={`btn h-20 text-4xl ${r === 4 || r === 6 ? 'btn-accent' : ''}`}
            aria-label={r === 0 ? 'Dot ball' : `${r} runs`}
          >
            {r === 0 ? '•' : r}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-4 gap-2">
        {EXTRAS.map((e) => (
          <button key={e.type} className="btn px-1 text-sm" onClick={() => setSheet(e.type)}>
            {e.label}
          </button>
        ))}
      </section>

      <button className="btn btn-hot h-16 text-2xl" onClick={() => setSheet('wicket')}>
        WICKET
      </button>

      <section className="grid grid-cols-3 gap-2">
        <button className="btn" onClick={undo} disabled={record.events.length === 0}>
          ↩ Undo
        </button>
        <button className="btn" onClick={redo} disabled={record.redo.length === 0}>
          Redo ↪
        </button>
        <button
          className="btn text-sm"
          onClick={() => {
            if (confirm('End this innings now?')) endInnings();
          }}
        >
          End innings
        </button>
      </section>

      <BowlerSheet
        open={needsBowler || sheet === 'bowler'}
        onClose={needsBowler ? undefined : () => setSheet(null)}
        config={config}
        state={state}
        current={bowler}
        onPick={(name) => {
          setBowler(overIdx, name);
          setSheet(null);
        }}
      />
      <ExtraSheet type={extraType} onPick={(n) => extraType && pickExtra(extraType, n)} onClose={() => setSheet(null)} />
      <WicketSheet
        open={sheet === 'wicket'}
        onClose={() => setSheet(null)}
        config={config}
        state={state}
        onSubmit={submitWicket}
      />
    </div>
  );
}