import { useNavigate } from 'react-router-dom';
import { pushMatch } from '../../lib/cloud';
import { db } from '../../lib/db';
import type { SavedMatch } from '../../lib/db';
import { configFor } from '../../lib/match';
import type { MatchView } from '../../lib/match';
import { useStore } from '../../lib/store';
import type { LiveMatch } from '../../lib/types';
import Scorecard from './Scorecard';

export default function ResultCard({ match, view }: { match: LiveMatch; view: MatchView }) {
  const navigate = useNavigate();
  const undo = useStore((s) => s.undo);
  const discardMatch = useStore((s) => s.discardMatch);
  const { setup } = match;

  const save = async () => {
    const saved: SavedMatch = {
      id: setup.id,
      playedAt: Date.now(),
      resultSummary: view.result?.summary ?? 'No result',
      winner: view.result?.winner ?? null,
      teams: [setup.teams[0].name, setup.teams[1].name],
      innings: match.innings.map((r, i) => ({
        config: configFor(setup, i, i === 1 ? view.config.target : undefined),
        events: r.events,
      })),
    };
    await db.matches.put(saved); // always saved on this device first
    await pushMatch(saved); // then the cloud, if signed in. Never blocks or fails the save.
    discardMatch();
    navigate('/stats');
  };

  const firstConfig = configFor(setup, 0);

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <section className="card bg-accent text-black">
        <p className="text-sm font-extrabold uppercase">Full time</p>
        <p className="mt-1 text-4xl font-extrabold leading-tight">
          {view.result?.summary ?? 'Match over'}
        </p>
      </section>
      <Scorecard title={firstConfig.battingTeam.name} state={view.first} config={firstConfig} />
      <Scorecard title={view.config.battingTeam.name} state={view.state} config={view.config} />
      <button className="btn btn-ink h-16 text-xl" onClick={save}>
        Save match &amp; see stats
      </button>
      <button className="btn" onClick={undo}>
        ↩ Undo last ball
      </button>
    </div>
  );
}