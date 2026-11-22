// All data shapes for the scoring engine. No logic here except DEFAULT_RULES.

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye';

export type WicketKind =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'stumped'
  | 'hitwicket'
  | 'runout'
  | 'other'; // house rules, e.g. over-the-wall = out

export interface Rules {
  oversPerInnings: number;
  ballsPerOver: number;
  wideRuns: number; // penalty runs for a wide
  noBallRuns: number; // penalty runs for a no-ball
  widesReBowled: boolean; // true = a wide does not count as a ball of the over
  noBallsReBowled: boolean;
  freeHitOnNoBall: boolean;
  lastManStands: boolean;
  lbwEnabled: boolean; // many gully games switch LBW off
}

export const DEFAULT_RULES: Rules = {
  oversPerInnings: 6,
  ballsPerOver: 6,
  wideRuns: 1,
  noBallRuns: 1,
  widesReBowled: true,
  noBallsReBowled: true,
  freeHitOnNoBall: true,
  lastManStands: false,
  lbwEnabled: false,
};

export interface Team {
  name: string;
  players: string[]; // batting order, also used as the fielding list
}

export interface InningsConfig {
  rules: Rules;
  battingTeam: Team;
  bowlingTeam: Team;
  openers: [striker: string, nonStriker: string];
  target?: number; // runs needed to win (first innings runs + 1). Only for chases.
}

// ---------- Events (the immutable log) ----------

export interface Wicket {
  kind: WicketKind;
  playerOut: string; // must be at the crease
  fielder?: string;
  incoming?: string; // next batter. Not needed when the innings ends or last man stands.
  note?: string;
}

export interface BallEvent {
  type: 'ball';
  id?: string; // later used to link DRS clips and sync
  ts?: number; // wall-clock ms, later used to find the video frame
  bowler: string;
  batRuns?: number; // runs off the bat (default 0)
  extra?: ExtraType;
  extraRuns?: number; // runs run on top of the penalty, or byes/leg-byes (default 0)
  wicket?: Wicket;
}

// Umpire correction: batters are at the wrong ends.
export interface SwapEndsEvent {
  type: 'swapEnds';
  id?: string;
  ts?: number;
}

export type InningsEvent = BallEvent | SwapEndsEvent;

// ---------- Derived state ----------

export interface BatterStats {
  name: string;
  runs: number;
  balls: number;
  fours: number; // counted when batRuns === 4
  sixes: number; // counted when batRuns === 6
  out: boolean;
  dismissal?: { kind: WicketKind; bowler?: string; fielder?: string; note?: string };
}

export interface BowlerStats {
  name: string;
  legalBalls: number;
  runs: number; // bat runs + wides + no-ball penalty (never byes or leg-byes)
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface BallSymbol {
  label: string; // '.', '1', '4', 'W', 'Wd', 'Wd+2', 'Nb+4', 'B1', 'Lb2', '1+W'
  legal: boolean;
  runs: number;
  wicket: boolean;
  bowler: string;
}

export type InningsStatus = 'inProgress' | 'allOut' | 'oversDone' | 'targetChased';

export interface InningsState {
  runs: number;
  wickets: number;
  wicketsInHand: number;
  legalBalls: number;
  overs: string; // "3.2"
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number };
  striker: string;
  nonStriker: string | null; // null when the last man is batting alone
  batters: BatterStats[];
  bowlers: BowlerStats[];
  currentOver: BallSymbol[];
  completedOvers: BallSymbol[][];
  freeHit: boolean;
  partnership: { runs: number; balls: number };
  status: InningsStatus;
  runRate: number;
  target?: number;
  runsNeeded?: number;
  ballsLeft: number;
  requiredRate?: number;
}