import type { BallEvent, InningsEvent, Rules, Team } from '@gully/core';

export interface MatchSetup {
  id: string;
  createdAt: number;
  teams: [Team, Team];
  rules: Rules;
  toss: { winner: 0 | 1; choice: 'bat' | 'bowl' };
  battingFirst: 0 | 1; // index into teams
}

export interface InningsRecord {
  events: InningsEvent[];
  redo: InningsEvent[];
  bowlerByOver: Record<number, string>; // over number (0-based) -> bowler name
  ended: boolean; // umpire ended the innings early
}

export interface LiveMatch {
  setup: MatchSetup;
  innings: InningsRecord[]; // 1 item, then 2 once the second innings starts
}

/** What the scoring buttons produce. The screen adds type, bowler, id and time. */
export type BallInput = Omit<BallEvent, 'type' | 'bowler' | 'id' | 'ts'>;