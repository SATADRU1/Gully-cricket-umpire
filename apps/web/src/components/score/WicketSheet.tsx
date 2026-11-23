import { useState } from 'react';
import type { InningsConfig, InningsState, WicketKind } from '@gully/core';
import type { BallInput } from '../../lib/types';
import Sheet from '../Sheet';
import { Label, Segmented } from '../ui';

const KINDS: { value: WicketKind; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'runout', label: 'Run out' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hitwicket', label: 'Hit wicket' },
  { value: 'lbw', label: 'LBW' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  config: InningsConfig;
  state: InningsState;
  /** Returns an error message, or null when the wicket was accepted. */
  onSubmit: (input: BallInput) => string | null;
}

export default function WicketSheet({ open, onClose, config, state, onSubmit }: Props) {
  return (
    <Sheet open={open} title="Wicket!" onClose={onClose}>
      <WicketForm config={config} state={state} onSubmit={onSubmit} />
    </Sheet>
  );
}

function WicketForm({ config, state, onSubmit }: Omit<Props, 'open' | 'onClose'>) {
  const unbatted = config.battingTeam.players.filter(
    (p) => !state.batters.some((b) => b.name === p),
  );
  const atCrease = [state.striker, ...(state.nonStriker ? [state.nonStriker] : [])];

  const [kind, setKind] = useState<WicketKind>('bowled');
  const [delivery, setDelivery] = useState<'normal' | 'wide' | 'noball'>('normal');
  const [outPlayer, setOutPlayer] = useState(state.striker);
  const [runs, setRuns] = useState(0);
  const [fielder, setFielder] = useState('');
  const [incoming, setIncoming] = useState(unbatted[0] ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const kinds = KINDS.filter((k) => k.value !== 'lbw' || config.rules.lbwEnabled);
  const choosePlayer = kind === 'runout' || kind === 'other';
  const showFielder = kind === 'caught' || kind === 'runout' || kind === 'stumped';

  const submit = () => {
    const input: BallInput = {
      extra: delivery === 'normal' ? undefined : delivery,
      wicket: {
        kind,
        playerOut: choosePlayer ? outPlayer : state.striker,
        fielder: showFielder && fielder ? fielder : undefined,
        incoming: unbatted.length > 0 ? incoming : undefined,
        note: kind === 'other' && note.trim() ? note.trim() : undefined,
      },
    };
    if (kind === 'runout' && runs > 0) {
      // runs completed before the run-out
      if (delivery === 'wide') input.extraRuns = runs;
      else input.batRuns = runs;
    }
    const err = onSubmit(input);
    if (err) setError(err);
  };

  return (
    <div>
      <Label>How was he out?</Label>
      <Segmented options={kinds} value={kind} onChange={setKind} />

      <Label>Delivery</Label>
      <Segmented
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'wide', label: 'Wide' },
          { value: 'noball', label: 'No ball' },
        ]}
        value={delivery}
        onChange={setDelivery}
      />

      {choosePlayer && (
        <>
          <Label>Who is out?</Label>
          <Segmented
            options={atCrease.map((p) => ({ value: p, label: p }))}
            value={outPlayer}
            onChange={setOutPlayer}
          />
        </>
      )}

      {kind === 'runout' && (
        <>
          <Label>Runs completed before the run out</Label>
          <Segmented
            options={[0, 1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
            value={runs}
            onChange={setRuns}
          />
        </>
      )}

      {kind === 'other' && (
        <>
          <Label>Reason (optional)</Label>
          <input
            className="field"
            placeholder="e.g. over the wall"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </>
      )}

      {showFielder && (
        <>
          <Label>Fielder (optional)</Label>
          <select className="field" value={fielder} onChange={(e) => setFielder(e.target.value)}>
            <option value="">Not recorded</option>
            {config.bowlingTeam.players.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </>
      )}

      {unbatted.length > 0 && (
        <>
          <Label>Next batter</Label>
          <select className="field" value={incoming} onChange={(e) => setIncoming(e.target.value)}>
            {unbatted.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-hot p-3 font-bold text-white">
          {error}
        </p>
      )}

      <button className="btn btn-hot mt-6 w-full text-xl" onClick={submit}>
        Confirm wicket
      </button>
    </div>
  );
}