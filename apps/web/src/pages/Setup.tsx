import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_RULES } from '@gully/core';
import type { Rules, Team } from '@gully/core';
import { Label, Segmented, Toggle } from '../components/ui';
import { useStore } from '../lib/store';
import type { MatchSetup } from '../lib/types';
import { uid } from '../lib/util';

const parsePlayers = (text: string): string[] =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const hasDuplicates = (list: string[]) =>
  new Set(list.map((s) => s.toLowerCase())).size !== list.length;

function validate(nameA: string, nameB: string, pa: string[], pb: string[], overs: number): string[] {
  const errors: string[] = [];
  if (!nameA.trim() || !nameB.trim()) errors.push('Both teams need a name.');
  if (nameA.trim().toLowerCase() === nameB.trim().toLowerCase()) errors.push('Team names must be different.');
  if (pa.length < 2) errors.push(`${nameA || 'Team A'} needs at least 2 players.`);
  if (pb.length < 2) errors.push(`${nameB || 'Team B'} needs at least 2 players.`);
  if (hasDuplicates(pa)) errors.push(`${nameA || 'Team A'} has two players with the same name. Add a surname or initial.`);
  if (hasDuplicates(pb)) errors.push(`${nameB || 'Team B'} has two players with the same name. Add a surname or initial.`);
  if (!Number.isInteger(overs) || overs < 1 || overs > 50) errors.push('Overs must be a whole number from 1 to 50.');
  return errors;
}

export default function Setup() {
  const navigate = useNavigate();
  const startMatch = useStore((s) => s.startMatch);
  const hasMatch = useStore((s) => s.match !== null);

  const [nameA, setNameA] = useState('Team A');
  const [nameB, setNameB] = useState('Team B');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [overs, setOvers] = useState('6');
  const [tossWinner, setTossWinner] = useState<0 | 1>(0);
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [errors, setErrors] = useState<string[]>([]);

  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) =>
    setRules((r) => ({ ...r, [key]: value }));

  const fillSample = () => {
    setTextA('Satadru\nRohan\nKabir\nIshaan\nDev');
    setTextB('Vihaan\nArjun\nSai\nRahul\nNeel');
  };

  const submit = () => {
    const pa = parsePlayers(textA);
    const pb = parsePlayers(textB);
    const ov = Number(overs);
    const errs = validate(nameA, nameB, pa, pb, ov);
    setErrors(errs);
    if (errs.length > 0) return;
    if (hasMatch && !confirm('This replaces the match in progress. Continue?')) return;

    const teams: [Team, Team] = [
      { name: nameA.trim(), players: pa },
      { name: nameB.trim(), players: pb },
    ];
    const battingFirst = (tossChoice === 'bat' ? tossWinner : 1 - tossWinner) as 0 | 1;
    const setup: MatchSetup = {
      id: uid(),
      createdAt: Date.now(),
      teams,
      rules: { ...rules, oversPerInnings: ov },
      toss: { winner: tossWinner, choice: tossChoice },
      battingFirst,
    };
    startMatch(setup);
    navigate('/match');
  };

  return (
    <div className="mx-auto max-w-xl pt-4">
      <h1 className="text-5xl font-extrabold leading-none">New match</h1>
      <button className="btn mt-4 px-3 py-1 text-sm" onClick={fillSample}>
        Fill sample players
      </button>

      <div className="mt-2 grid gap-6 sm:grid-cols-2">
        <div>
          <Label>Team A name</Label>
          <input className="field" value={nameA} onChange={(e) => setNameA(e.target.value)} />
          <Label>Players, in batting order (one per line)</Label>
          <textarea className="field h-44" value={textA} onChange={(e) => setTextA(e.target.value)} />
        </div>
        <div>
          <Label>Team B name</Label>
          <input className="field" value={nameB} onChange={(e) => setNameB(e.target.value)} />
          <Label>Players, in batting order (one per line)</Label>
          <textarea className="field h-44" value={textB} onChange={(e) => setTextB(e.target.value)} />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        The first two players of the batting team open the innings.
      </p>

      <Label>Overs per innings</Label>
      <input
        className="field w-28"
        type="number"
        inputMode="numeric"
        min={1}
        max={50}
        value={overs}
        onChange={(e) => setOvers(e.target.value)}
      />

      <Label>Toss won by</Label>
      <Segmented
        options={[
          { value: 0 as 0 | 1, label: nameA.trim() || 'Team A' },
          { value: 1 as 0 | 1, label: nameB.trim() || 'Team B' },
        ]}
        value={tossWinner}
        onChange={setTossWinner}
      />
      <Label>They chose to</Label>
      <Segmented
        options={[
          { value: 'bat' as const, label: 'Bat' },
          { value: 'bowl' as const, label: 'Bowl' },
        ]}
        value={tossChoice}
        onChange={setTossChoice}
      />

      <Label>Gully rules</Label>
      <div className="grid gap-2">
        <Toggle
          label="Wides are re-bowled"
          hint="Off = a wide counts as one ball of the over"
          checked={rules.widesReBowled}
          onChange={(v) => setRule('widesReBowled', v)}
        />
        <Toggle
          label="No-balls are re-bowled"
          hint="Off = a no-ball counts as one ball of the over"
          checked={rules.noBallsReBowled}
          onChange={(v) => setRule('noBallsReBowled', v)}
        />
        <Toggle
          label="Free hit after a no-ball"
          checked={rules.freeHitOnNoBall}
          onChange={(v) => setRule('freeHitOnNoBall', v)}
        />
        <Toggle
          label="Last man stands"
          hint="The last batter bats alone"
          checked={rules.lastManStands}
          onChange={(v) => setRule('lastManStands', v)}
        />
        <Toggle
          label="LBW allowed"
          checked={rules.lbwEnabled}
          onChange={(v) => setRule('lbwEnabled', v)}
        />
      </div>

      <Label>Runs for a wide</Label>
      <Segmented
        options={[0, 1, 2].map((n) => ({ value: n, label: String(n) }))}
        value={rules.wideRuns}
        onChange={(v) => setRule('wideRuns', v)}
      />
      <Label>Runs for a no-ball</Label>
      <Segmented
        options={[0, 1, 2].map((n) => ({ value: n, label: String(n) }))}
        value={rules.noBallRuns}
        onChange={(v) => setRule('noBallRuns', v)}
      />

      {errors.length > 0 && (
        <ul role="alert" className="mt-6 grid gap-1 rounded-xl bg-hot p-4 font-bold text-white">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      <button className="btn btn-accent mt-8 h-16 w-full text-2xl" onClick={submit}>
        Start match
      </button>
    </div>
  );
}