import { computeInnings, decideResult, targetFor } from '@gully/core';
import type { InningsConfig, InningsState, InningsStatus, MatchResult } from '@gully/core';
import type { InningsRecord, LiveMatch, MatchSetup } from './types';

export function battingIndexFor(setup: MatchSetup, inningsIndex: number): 0 | 1 {
  return inningsIndex === 0 ? setup.battingFirst : ((1 - setup.battingFirst) as 0 | 1);
}

/** Players are listed in batting order, so the first two are the openers. */
export function configFor(setup: MatchSetup, inningsIndex: number, target?: number): InningsConfig {
  const bi = battingIndexFor(setup, inningsIndex);
  const batting = setup.teams[bi];
  const bowling = setup.teams[bi === 0 ? 1 : 0];
  return {
    rules: setup.rules,
    battingTeam: batting,
    bowlingTeam: bowling,
    openers: [batting.players[0], batting.players[1]],
    target,
  };
}

export const emptyInnings = (): InningsRecord => ({
  events: [],
  redo: [],
  bowlerByOver: {},
  ended: false,
});

export interface MatchView {
  inningsIndex: number; // 0 or 1
  config: InningsConfig;
  record: InningsRecord;
  state: InningsState;
  status: InningsStatus; // 'inProgress' until the innings is over (or ended early)
  first: InningsState;
  result: MatchResult | null; // only when the 2nd innings is over
}

/** Everything the screens need, derived from the stored events. */
export function describeMatch(m: LiveMatch): MatchView {
  const inningsIndex = m.innings.length - 1;
  const firstConfig = configFor(m.setup, 0);
  const first = computeInnings(firstConfig, m.innings[0].events);
  const config =
    inningsIndex === 0 ? firstConfig : configFor(m.setup, 1, targetFor(first));
  const record = m.innings[inningsIndex];
  const state = inningsIndex === 0 ? first : computeInnings(config, record.events);
  const status: InningsStatus =
    record.ended && state.status === 'inProgress' ? 'oversDone' : state.status;

  let result: MatchResult | null = null;
  if (inningsIndex === 1 && status !== 'inProgress') {
    result = decideResult(
      first,
      { ...state, status },
      { first: config.bowlingTeam.name, second: config.battingTeam.name },
    );
  }
  return { inningsIndex, config, record, state, status, first, result };
}