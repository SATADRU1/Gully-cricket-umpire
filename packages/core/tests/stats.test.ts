import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, aggregatePlayers, seasonHero } from '../src';
import type { BallEvent, InningsConfig } from '../src';

const config: InningsConfig = {
  rules: { ...DEFAULT_RULES, oversPerInnings: 2 },
  battingTeam: { name: 'A', players: ['A1', 'A2', 'A3'] },
  bowlingTeam: { name: 'B', players: ['B1', 'B2', 'B3'] },
  openers: ['A1', 'A2'],
};
const b = (x: Partial<BallEvent>): BallEvent => ({ type: 'ball', bowler: 'B1', ...x });

// A1 hits 4 and 6, is bowled by B1. A3 comes in. Over 2 is bowled by B2.
const events: BallEvent[] = [
  b({ batRuns: 4 }),
  b({ batRuns: 6 }),
  b({ wicket: { kind: 'bowled', playerOut: 'A1', incoming: 'A3' } }),
  b({ batRuns: 1 }),
  b({}),
  b({}),
  b({ bowler: 'B2', extra: 'wide' }),
  b({ bowler: 'B2', batRuns: 2 }),
];

describe('aggregatePlayers', () => {
  const players = aggregatePlayers([{ matchId: 'm1', config, events }]);
  const get = (n: string) => players.find((p) => p.name === n)!;

  it('batting numbers', () => {
    expect(get('A1')).toMatchObject({
      battingInnings: 1,
      runs: 10,
      balls: 3,
      fours: 1,
      sixes: 1,
      outs: 1,
      highScore: 10,
      average: 10,
    });
    expect(get('A1').strikeRate).toBeCloseTo(333.33, 1);
    expect(get('A2')).toMatchObject({ runs: 0, balls: 2, outs: 0, average: null });
    expect(get('A3')).toMatchObject({ runs: 3, balls: 2 });
  });

  it('bowling numbers', () => {
    expect(get('B1')).toMatchObject({ legalBalls: 6, runsConceded: 11, wickets: 1 });
    expect(get('B1').economy).toBeCloseTo(11, 5);
    expect(get('B2')).toMatchObject({ legalBalls: 1, runsConceded: 3, wickets: 0 });
    expect(get('B2').economy).toBeCloseTo(18, 5);
    expect(get('A1').economy).toBeNull();
  });

  it('adds up over several matches', () => {
    const two = aggregatePlayers([
      { matchId: 'm1', config, events },
      { matchId: 'm2', config, events },
    ]);
    const a1 = two.find((p) => p.name === 'A1')!;
    expect(a1.matches).toBe(2);
    expect(a1.runs).toBe(20);
  });

  it('season hero uses runs plus 25 per wicket', () => {
    expect(seasonHero(players)?.name).toBe('B1'); // 25 beats A1's 10
    expect(seasonHero([])).toBeNull();
  });

  it('skips a broken innings instead of crashing', () => {
    const bad = [b({ batRuns: -1 })];
    expect(aggregatePlayers([{ matchId: 'x', config, events: bad }])).toEqual([]);
  });
});