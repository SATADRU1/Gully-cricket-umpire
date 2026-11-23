import type { BatterStats, InningsConfig, InningsState } from '@gully/core';

function dismissalText(b: BatterStats): string {
  if (!b.out || !b.dismissal) return 'not out';
  const d = b.dismissal;
  switch (d.kind) {
    case 'bowled':
      return `b ${d.bowler}`;
    case 'caught':
      return d.fielder ? `c ${d.fielder} b ${d.bowler}` : `c b ${d.bowler}`;
    case 'lbw':
      return `lbw b ${d.bowler}`;
    case 'stumped':
      return d.fielder ? `st ${d.fielder} b ${d.bowler}` : `st b ${d.bowler}`;
    case 'hitwicket':
      return `hit wkt b ${d.bowler}`;
    case 'runout':
      return d.fielder ? `run out (${d.fielder})` : 'run out';
    default:
      return d.note ?? 'out';
  }
}

interface Props {
  title: string;
  state: InningsState;
  config: InningsConfig;
}

export default function Scorecard({ title, state, config }: Props) {
  const bpo = config.rules.ballsPerOver;
  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-extrabold">{title}</h3>
        <p className="text-xl font-extrabold">
          {state.runs}/{state.wickets} <span className="text-sm text-muted">({state.overs} ov)</span>
        </p>
      </div>

      <div className="mt-3 divide-y divide-ink/20">
        {state.batters.map((b) => (
          <div key={b.name} className="flex items-baseline justify-between py-1.5">
            <p className="font-bold">
              {b.name} <span className="ml-1 text-sm font-medium text-muted">{dismissalText(b)}</span>
            </p>
            <p className="font-bold">
              {b.runs} <span className="text-sm font-medium text-muted">({b.balls})</span>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-sm text-muted">
        Extras {state.extras.total} (wd {state.extras.wides}, nb {state.extras.noBalls}, b{' '}
        {state.extras.byes}, lb {state.extras.legByes})
      </p>

      <div className="mt-3 border-t-2 border-ink pt-2">
        {state.bowlers.map((b) => (
          <div key={b.name} className="flex items-baseline justify-between py-1">
            <p className="font-bold">{b.name}</p>
            <p className="text-sm font-semibold">
              {Math.floor(b.legalBalls / bpo)}.{b.legalBalls % bpo} ov · {b.runs} runs · {b.wickets} wkts
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}