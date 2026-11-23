import type { InningsConfig, InningsState } from '@gully/core';
import Sheet from '../Sheet';

interface Props {
  open: boolean;
  onClose?: () => void;
  config: InningsConfig;
  state: InningsState;
  current?: string;
  onPick: (name: string) => void;
}

export default function BowlerSheet({ open, onClose, config, state, current, onPick }: Props) {
  const bpo = config.rules.ballsPerOver;
  const figures = (name: string) => {
    const b = state.bowlers.find((x) => x.name === name);
    if (!b) return 'not bowled yet';
    return `${Math.floor(b.legalBalls / bpo)}.${b.legalBalls % bpo} ov · ${b.runs} runs · ${b.wickets} wkts`;
  };
  return (
    <Sheet open={open} title="Who is bowling?" onClose={onClose}>
      <div className="grid gap-2">
        {config.bowlingTeam.players.map((name) => (
          <button
            key={name}
            onClick={() => onPick(name)}
            className={`btn justify-between text-left ${name === current ? 'btn-accent' : ''}`}
          >
            <span>{name}</span>
            <span className="text-sm font-semibold opacity-70">{figures(name)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}