import { useStore } from '../../lib/store';
import type { MatchView } from '../../lib/match';
import Scorecard from './Scorecard';

export default function InningsBreak({ view }: { view: MatchView }) {
  const undo = useStore((s) => s.undo);
  const startSecondInnings = useStore((s) => s.startSecondInnings);
  const { state, config } = view;

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <section className="card bg-accent text-black">
        <p className="text-sm font-extrabold uppercase">Innings break</p>
        <p className="mt-1 text-3xl font-extrabold">
          {config.battingTeam.name} {state.runs}/{state.wickets}
        </p>
        <p className="mt-2 text-xl font-bold">
          {config.bowlingTeam.name} need {state.runs + 1} to win
        </p>
      </section>
      <Scorecard title={config.battingTeam.name} state={state} config={config} />
      <button className="btn btn-ink h-16 text-xl" onClick={startSecondInnings}>
        Start 2nd innings
      </button>
      <button className="btn" onClick={undo}>
        ↩ Undo last ball
      </button>
    </div>
  );
}