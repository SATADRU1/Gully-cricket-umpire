import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RULES,
  EventLog,
  InvalidEventError,
  applyEvent,
  computeInnings,
  decideResult,
  targetFor,
} from '../src';
import type { BallEvent, InningsConfig, InningsEvent, Rules } from '../src';

// ---------- helpers ----------
const names = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

function cfg(rules: Partial<Rules> = {}, players = 6, extra: Partial<InningsConfig> = {}): InningsConfig {
  return {
    rules: { ...DEFAULT_RULES, ...rules },
    battingTeam: { name: 'Team A', players: names('A', players) },
    bowlingTeam: { name: 'Team B', players: names('B', players) },
    openers: ['A1', 'A2'],
    ...extra,
  };
}
const ball = (b: Partial<BallEvent> = {}): BallEvent => ({ type: 'ball', bowler: 'B1', ...b });
const repeat = (n: number, b: Partial<BallEvent> = {}): BallEvent[] => Array.from({ length: n }, () => ball(b));
const batter = (s: ReturnType<typeof computeInnings>, name: string) => s.batters.find((b) => b.name === name)!;
const bowlerOf = (s: ReturnType<typeof computeInnings>, name = 'B1') => s.bowlers.find((b) => b.name === name)!;

// ---------- basics ----------
describe('runs, balls, strike', () => {
  it('starts empty', () => {
    const s = computeInnings(cfg(), []);
    expect(s.runs).toBe(0);
    expect(s.overs).toBe('0.0');
    expect(s.striker).toBe('A1');
    expect(s.nonStriker).toBe('A2');
  });

  it('credits runs and swaps strike on an odd run', () => {
    const s = computeInnings(cfg(), [ball(), ball({ batRuns: 1 })]);
    expect(s.runs).toBe(1);
    expect(s.legalBalls).toBe(2);
    expect(s.overs).toBe('0.2');
    expect(batter(s, 'A1')).toMatchObject({ runs: 1, balls: 2 });
    expect(s.striker).toBe('A2');
  });

  it('keeps strike on even runs and counts fours and sixes', () => {
    const s = computeInnings(cfg(), [ball({ batRuns: 4 }), ball({ batRuns: 6 }), ball({ batRuns: 2 })]);
    expect(s.striker).toBe('A1');
    expect(batter(s, 'A1')).toMatchObject({ runs: 12, fours: 1, sixes: 1 });
  });

  it('swaps strike at the end of an over and records the over', () => {
    const s = computeInnings(cfg(), repeat(6));
    expect(s.overs).toBe('1.0');
    expect(s.completedOvers).toHaveLength(1);
    expect(s.currentOver).toHaveLength(0);
    expect(s.striker).toBe('A2');
  });

  it('single off the last ball: swaps for the run and again for the over', () => {
    const s = computeInnings(cfg(), [...repeat(5), ball({ batRuns: 1 })]);
    expect(s.striker).toBe('A1');
  });

  it('builds over labels', () => {
    const s = computeInnings(cfg(), [ball(), ball({ batRuns: 4 }), ball({ extra: 'wide' })]);
    expect(s.currentOver.map((b) => b.label)).toEqual(['.', '4', 'Wd']);
  });
});

// ---------- extras ----------
describe('wides', () => {
  it('adds a penalty run and is not a legal ball (default)', () => {
    const s = computeInnings(cfg(), [ball({ extra: 'wide' })]);
    expect(s.runs).toBe(1);
    expect(s.legalBalls).toBe(0);
    expect(s.extras.wides).toBe(1);
    expect(bowlerOf(s)).toMatchObject({ runs: 1, legalBalls: 0, wides: 1 });
    expect(batter(s, 'A1').balls).toBe(0);
  });

  it('counts runs run on a wide and rotates strike on an odd number', () => {
    const s = computeInnings(cfg(), [ball({ extra: 'wide', extraRuns: 1 })]);
    expect(s.runs).toBe(2);
    expect(s.extras.wides).toBe(2);
    expect(s.striker).toBe('A2');
  });

  it('counts as a ball of the over when widesReBowled is off', () => {
    const s = computeInnings(cfg({ widesReBowled: false }), [ball({ extra: 'wide' })]);
    expect(s.legalBalls).toBe(1);
  });

  it('respects a custom wide penalty', () => {
    const s = computeInnings(cfg({ wideRuns: 2 }), [ball({ extra: 'wide' })]);
    expect(s.runs).toBe(2);
  });

  it('rejects runs off the bat on a wide', () => {
    expect(() => computeInnings(cfg(), [ball({ extra: 'wide', batRuns: 1 })])).toThrow(InvalidEventError);
  });
});

describe('no-balls and free hits', () => {
  it('gives bat runs to the batter and the penalty to the bowler', () => {
    const s = computeInnings(cfg(), [ball({ extra: 'noball', batRuns: 4 })]);
    expect(s.runs).toBe(5);
    expect(batter(s, 'A1')).toMatchObject({ runs: 4, balls: 1, fours: 1 });
    expect(bowlerOf(s)).toMatchObject({ runs: 5, noBalls: 1, legalBalls: 0 });
    expect(s.extras.noBalls).toBe(1);
    expect(s.freeHit).toBe(true);
  });

  it('blocks bowled on the free hit, allows it afterwards', () => {
    const base = [ball({ extra: 'noball' })];
    const bowled = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [...base, bowled])).toThrow(/free hit/);
    const s = computeInnings(cfg(), [...base, ball({ batRuns: 1 })]);
    expect(s.freeHit).toBe(false);
  });

  it('allows a run-out on the free hit, not credited to the bowler', () => {
    const s = computeInnings(cfg(), [
      ball({ extra: 'noball' }),
      ball({ wicket: { kind: 'runout', playerOut: 'A2', incoming: 'A3' } }),
    ]);
    expect(s.wickets).toBe(1);
    expect(s.nonStriker).toBe('A3');
    expect(bowlerOf(s).wickets).toBe(0);
  });

  it('keeps the free hit through a wide', () => {
    const events = [ball({ extra: 'noball' }), ball({ extra: 'wide' })];
    expect(computeInnings(cfg(), events).freeHit).toBe(true);
    const bowled = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [...events, bowled])).toThrow(InvalidEventError);
  });

  it('does not start a free hit when the rule is off', () => {
    expect(computeInnings(cfg({ freeHitOnNoBall: false }), [ball({ extra: 'noball' })]).freeHit).toBe(false);
  });

  it('rejects bowled on the no-ball itself', () => {
    const bowled = ball({ extra: 'noball', wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [bowled])).toThrow(/no-ball/);
  });
});

describe('byes and leg-byes', () => {
  it('count for the team only and rotate strike', () => {
    const s = computeInnings(cfg(), [ball({ extra: 'bye', extraRuns: 1 })]);
    expect(s.runs).toBe(1);
    expect(s.extras.byes).toBe(1);
    expect(batter(s, 'A1')).toMatchObject({ runs: 0, balls: 1 });
    expect(bowlerOf(s).runs).toBe(0);
    expect(s.legalBalls).toBe(1);
    expect(s.striker).toBe('A2');
  });

  it('leg-byes of 2 keep the strike', () => {
    const s = computeInnings(cfg(), [ball({ extra: 'legbye', extraRuns: 2 })]);
    expect(s.extras.legByes).toBe(2);
    expect(s.striker).toBe('A1');
  });

  it('need at least one run', () => {
    expect(() => computeInnings(cfg(), [ball({ extra: 'bye' })])).toThrow(InvalidEventError);
  });
});

// ---------- wickets ----------
describe('wickets', () => {
  const bowledA1 = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });

  it('credits the bowler, brings in the next batter', () => {
    const s = computeInnings(cfg(), [bowledA1]);
    expect(s.wickets).toBe(1);
    expect(s.striker).toBe('A3');
    expect(batter(s, 'A1')).toMatchObject({ out: true });
    expect(batter(s, 'A1').dismissal).toMatchObject({ kind: 'bowled', bowler: 'B1' });
    expect(bowlerOf(s).wickets).toBe(1);
    expect(s.partnership).toEqual({ runs: 0, balls: 0 });
  });

  it('needs an incoming batter', () => {
    const e = ball({ wicket: { kind: 'bowled', playerOut: 'A1' } });
    expect(() => computeInnings(cfg(), [e])).toThrow(/incoming/);
  });

  it('rejects an incoming batter who already batted or is not in the team', () => {
    const again = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A2' } });
    const stranger = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'Z9' } });
    expect(() => computeInnings(cfg(), [again])).toThrow(InvalidEventError);
    expect(() => computeInnings(cfg(), [stranger])).toThrow(InvalidEventError);
  });

  it('rejects a dismissal of someone not at the crease', () => {
    const e = ball({ wicket: { kind: 'bowled', playerOut: 'A5', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [e])).toThrow(/crease/);
  });

  it('wicket on the last ball of an over still swaps ends for the new over', () => {
    const s = computeInnings(cfg(), [...repeat(5), bowledA1]);
    expect(s.striker).toBe('A2');
    expect(s.nonStriker).toBe('A3');
  });

  it('run-out: counts completed runs, not credited to the bowler', () => {
    const s = computeInnings(cfg(), [
      ball({ batRuns: 1, wicket: { kind: 'runout', playerOut: 'A1', incoming: 'A3' } }),
    ]);
    expect(s.runs).toBe(1);
    expect(batter(s, 'A1').runs).toBe(1);
    expect(s.striker).toBe('A2');
    expect(s.nonStriker).toBe('A3');
    expect(bowlerOf(s).wickets).toBe(0);
  });

  it('rejects runs on a caught', () => {
    const e = ball({ batRuns: 1, wicket: { kind: 'caught', playerOut: 'A1', incoming: 'A3', fielder: 'B2' } });
    expect(() => computeInnings(cfg(), [e])).toThrow(InvalidEventError);
  });

  it('stumped is allowed on a wide, bowled is not', () => {
    const stumped = ball({
      extra: 'wide',
      wicket: { kind: 'stumped', playerOut: 'A1', incoming: 'A3', fielder: 'B2' },
    });
    const s = computeInnings(cfg(), [stumped]);
    expect(s.wickets).toBe(1);
    expect(s.runs).toBe(1);
    expect(batter(s, 'A1').balls).toBe(0);
    const bowled = ball({ extra: 'wide', wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [bowled])).toThrow(InvalidEventError);
  });

  it('LBW only when switched on', () => {
    const lbw = ball({ wicket: { kind: 'lbw', playerOut: 'A1', incoming: 'A3' } });
    expect(() => computeInnings(cfg(), [lbw])).toThrow(/LBW/);
    expect(computeInnings(cfg({ lbwEnabled: true }), [lbw]).wickets).toBe(1);
  });

  it('house-rule wicket (over the wall) is allowed and not credited to the bowler', () => {
    const e = ball({ wicket: { kind: 'other', playerOut: 'A1', incoming: 'A3', note: 'over the wall' } });
    const s = computeInnings(cfg(), [e]);
    expect(s.wickets).toBe(1);
    expect(bowlerOf(s).wickets).toBe(0);
  });
});

// ---------- innings end ----------
describe('end of innings', () => {
  it('all out at players - 1 wickets', () => {
    const c = cfg({}, 3);
    const events = [
      ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } }),
      ball({ wicket: { kind: 'bowled', playerOut: 'A3' } }),
    ];
    const s = computeInnings(c, events);
    expect(s.status).toBe('allOut');
    expect(() => computeInnings(c, [...events, ball()])).toThrow(/already over/);
  });

  it('last man stands: last batter carries on alone, no strike rotation', () => {
    const c = cfg({ lastManStands: true }, 3);
    const first = ball({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } });
    const second = ball({ wicket: { kind: 'bowled', playerOut: 'A3' } });
    let s = computeInnings(c, [first, second]);
    expect(s.status).toBe('inProgress');
    expect(s.striker).toBe('A2');
    expect(s.nonStriker).toBeNull();
    s = computeInnings(c, [first, second, ball({ batRuns: 1 })]);
    expect(s.striker).toBe('A2');
    s = computeInnings(c, [first, second, ball({ wicket: { kind: 'bowled', playerOut: 'A2' } })]);
    expect(s.status).toBe('allOut');
    expect(s.wickets).toBe(3);
  });

  it('overs done', () => {
    const c = cfg({ oversPerInnings: 1 });
    const s = computeInnings(c, repeat(6));
    expect(s.status).toBe('oversDone');
    expect(() => computeInnings(c, [...repeat(6), ball()])).toThrow(/already over/);
  });

  it('chase: required rate and target chased', () => {
    const c = cfg({}, 6, { target: 10 });
    let s = computeInnings(c, [ball({ batRuns: 4 }), ball({ batRuns: 2 })]);
    expect(s.runsNeeded).toBe(4);
    expect(s.ballsLeft).toBe(34);
    expect(s.requiredRate).toBeCloseTo(0.71, 2);
    s = computeInnings(c, [ball({ batRuns: 4 }), ball({ batRuns: 4 }), ball({ batRuns: 2 })]);
    expect(s.status).toBe('targetChased');
    expect(() => computeInnings(c, [ball({ batRuns: 6 }), ball({ batRuns: 6 }), ball()])).toThrow(/already over/);
  });
});

// ---------- partnership, swap, validation ----------
describe('misc', () => {
  it('tracks the partnership', () => {
    const s = computeInnings(cfg(), [ball({ batRuns: 2 }), ball({ extra: 'wide' }), ball({ batRuns: 1 })]);
    expect(s.partnership).toEqual({ runs: 4, balls: 2 });
  });

  it('swapEnds fixes the batters at the wrong ends', () => {
    const s = computeInnings(cfg(), [{ type: 'swapEnds' }]);
    expect(s.striker).toBe('A2');
  });

  it('rejects a bowler from the wrong team', () => {
    expect(() => computeInnings(cfg(), [ball({ bowler: 'A4' })])).toThrow(InvalidEventError);
  });

  it('rejects negative and fractional runs', () => {
    expect(() => computeInnings(cfg(), [ball({ batRuns: -1 })])).toThrow(InvalidEventError);
    expect(() => computeInnings(cfg(), [ball({ batRuns: 1.5 })])).toThrow(InvalidEventError);
  });

  it('is pure: same events give the same state', () => {
    const events = [...repeat(7), ball({ batRuns: 3 })];
    expect(computeInnings(cfg(), events)).toEqual(computeInnings(cfg(), events));
  });
});

// ---------- undo / redo ----------
describe('EventLog', () => {
  it('undo and redo', () => {
    const c = cfg();
    const log = new EventLog<InningsEvent>();
    applyEvent(c, log, ball({ batRuns: 1 }));
    applyEvent(c, log, ball({ batRuns: 4 }));
    expect(computeInnings(c, log.events).runs).toBe(5);
    log.undo();
    expect(computeInnings(c, log.events).runs).toBe(1);
    expect(log.canRedo).toBe(true);
    log.redo();
    expect(computeInnings(c, log.events).runs).toBe(5);
  });

  it('a new event clears redo', () => {
    const c = cfg();
    const log = new EventLog<InningsEvent>();
    applyEvent(c, log, ball());
    log.undo();
    applyEvent(c, log, ball({ batRuns: 2 }));
    expect(log.canRedo).toBe(false);
  });

  it('an illegal event leaves the log untouched', () => {
    const c = cfg();
    const log = new EventLog<InningsEvent>();
    expect(() => applyEvent(c, log, ball({ batRuns: -3 }))).toThrow(InvalidEventError);
    expect(log.events).toHaveLength(0);
  });
});

// ---------- results and super over ----------
describe('match result', () => {
  const t = { first: 'Team A', second: 'Team B' };
  const first = () => computeInnings(cfg({ oversPerInnings: 1 }), repeat(6, { batRuns: 1 })); // 6 runs

  it('second team wins by wickets', () => {
    const f = first();
    const c = cfg({ oversPerInnings: 1 }, 6, { target: targetFor(f) });
    const s = computeInnings(c, [ball({ batRuns: 4 }), ball({ batRuns: 3 })]);
    expect(decideResult(f, s, t)).toEqual({ winner: 'Team B', summary: 'Team B won by 5 wickets' });
  });

  it('first team wins by runs', () => {
    const f = first();
    const c = cfg({ oversPerInnings: 1 }, 6, { target: targetFor(f) });
    const s = computeInnings(c, [...repeat(3, { batRuns: 1 }), ...repeat(3)]);
    expect(decideResult(f, s, t)).toEqual({ winner: 'Team A', summary: 'Team A won by 3 runs' });
  });

  it('tie, then a super over decides it', () => {
    const f = first();
    const c = cfg({ oversPerInnings: 1 }, 6, { target: targetFor(f) });
    const s = computeInnings(c, repeat(6, { batRuns: 1 }));
    expect(decideResult(f, s, t)).toEqual({ winner: null, summary: 'Match tied' });

    // super over: 1 over, 3 players, same engine
    const so = (runsPerBall: number, target?: number) =>
      computeInnings(cfg({ oversPerInnings: 1 }, 3, { target }), repeat(6, { batRuns: runsPerBall }));
    const soFirst = so(2); // 12
    const soSecond = so(1, targetFor(soFirst)); // 6, target 13
    expect(decideResult(soFirst, soSecond, t)?.winner).toBe('Team A');
  });

  it('is undecided while the chase is on', () => {
    const f = first();
    const c = cfg({ oversPerInnings: 1 }, 6, { target: targetFor(f) });
    expect(decideResult(f, computeInnings(c, [ball()]), t)).toBeNull();
  });
});