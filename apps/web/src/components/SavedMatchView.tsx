import { computeInnings } from '@gully/core';
import type { InningsConfig, InningsEvent } from '@gully/core';
import Scorecard from './score/Scorecard';

interface Props {
  summary: string;
  innings: { config: InningsConfig; events: InningsEvent[] }[];
}

/** Read-only result and scorecards for a finished match. */
export default function SavedMatchView({ summary, innings }: Props) {
  return (
    <div className="grid gap-4">
      <p className="text-2xl font-extrabold">{summary}</p>
      {innings.map((inn, i) => {
        try {
          const state = computeInnings(inn.config, inn.events);
          return <Scorecard key={i} title={inn.config.battingTeam.name} state={state} config={inn.config} />;
        } catch {
          return (
            <p key={i} className="text-muted">
              Could not read innings {i + 1}.
            </p>
          );
        }
      })}
    </div>
  );
}