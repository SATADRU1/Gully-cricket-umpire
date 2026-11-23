import { computeInnings } from './engine';
import type { InningsConfig, InningsEvent, InningsState } from './types';

export interface InningsInput {
  matchId: string;
  config: InningsConfig;
  events: readonly InningsEvent[];
}

export interface PlayerStats {
  name: string;
  matches: number;
  // batting
  battingInnings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  outs: number;
  highScore: number;
  strikeRate: number;
  average: number | null; // null when the player has never been out
  // bowling
  legalBalls: number;
  runsConceded: number;
  wickets: number;
  economy: number | null; // runs per over, null when the player never bowled
  // season hero score
  impact: number;
}

/** Season hero score = runs + HERO_WICKET_POINTS per wicket. Change this to change who wins. */
export const HERO_WICKET_POINTS = 25;

interface Acc {
  name: string;
  matches: Set<string>;
  battingInnings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  outs: number;
  highScore: number;
  legalBalls: number;
  oversDecimal: number;
  runsConceded: number;
  wickets: number;
}

export function aggregatePlayers(innings: readonly InningsInput[]): PlayerStats[] {
  const acc = new Map<string, Acc>();
  const get = (name: string, matchId: string): Acc => {
    let a = acc.get(name);
    if (!a) {
      a = {
        name,
        matches: new Set(),
        battingInnings: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        outs: 0,
        highScore: 0,
        legalBalls: 0,
        oversDecimal: 0,
        runsConceded: 0,
        wickets: 0,
      };
      acc.set(name, a);
    }
    a.matches.add(matchId);
    return a;
  };

  for (const inn of innings) {
    let state: InningsState;
    try {
      state = computeInnings(inn.config, inn.events);
    } catch {
      continue; // never let one bad saved innings break the whole stats page
    }
    const bpo = inn.config.rules.ballsPerOver;

    for (const b of state.batters) {
      const a = get(b.name, inn.matchId);
      a.battingInnings++;
      a.runs += b.runs;
      a.balls += b.balls;
      a.fours += b.fours;
      a.sixes += b.sixes;
      if (b.out) a.outs++;
      a.highScore = Math.max(a.highScore, b.runs);
    }
    for (const bw of state.bowlers) {
      const a = get(bw.name, inn.matchId);
      a.legalBalls += bw.legalBalls;
      a.oversDecimal += bw.legalBalls / bpo;
      a.runsConceded += bw.runs;
      a.wickets += bw.wickets;
    }
  }

  return [...acc.values()]
    .map((a): PlayerStats => ({
      name: a.name,
      matches: a.matches.size,
      battingInnings: a.battingInnings,
      runs: a.runs,
      balls: a.balls,
      fours: a.fours,
      sixes: a.sixes,
      outs: a.outs,
      highScore: a.highScore,
      strikeRate: a.balls > 0 ? (a.runs / a.balls) * 100 : 0,
      average: a.outs > 0 ? a.runs / a.outs : null,
      legalBalls: a.legalBalls,
      runsConceded: a.runsConceded,
      wickets: a.wickets,
      economy: a.oversDecimal > 0 ? a.runsConceded / a.oversDecimal : null,
      impact: a.runs + HERO_WICKET_POINTS * a.wickets,
    }))
    .sort((x, y) => y.impact - x.impact || y.runs - x.runs || x.name.localeCompare(y.name));
}

export function seasonHero(players: readonly PlayerStats[]): PlayerStats | null {
  let best: PlayerStats | null = null;
  for (const p of players) {
    if (p.impact > 0 && (best === null || p.impact > best.impact)) best = p;
  }
  return best;
}   