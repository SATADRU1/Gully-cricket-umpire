import type {
  BallEvent,
  BallSymbol,
  BatterStats,
  BowlerStats,
  InningsConfig,
  InningsEvent,
  InningsState,
  InningsStatus,
  WicketKind,
} from './types';

export class InvalidEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventError';
  }
}

function fail(message: string): never {
  throw new InvalidEventError(message);
}

const BOWLER_CREDIT = new Set<WicketKind>(['bowled', 'caught', 'lbw', 'stumped', 'hitwicket']);

function checkCount(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    fail(`${name} must be a whole number of 0 or more (got ${value})`);
  }
}

function validateConfig(config: InningsConfig): void {
  const { rules, battingTeam, bowlingTeam, openers } = config;
  if (!Number.isInteger(rules.oversPerInnings) || rules.oversPerInnings < 1) {
    fail('oversPerInnings must be a whole number of 1 or more');
  }
  if (!Number.isInteger(rules.ballsPerOver) || rules.ballsPerOver < 1) {
    fail('ballsPerOver must be a whole number of 1 or more');
  }
  if (battingTeam.players.length < 2) fail('batting team needs at least 2 players');
  if (bowlingTeam.players.length < 1) fail('bowling team needs at least 1 player');
  if (openers[0] === openers[1]) fail('the two openers must be different players');
  for (const o of openers) {
    if (!battingTeam.players.includes(o)) fail(`opener "${o}" is not in ${battingTeam.name}`);
  }
}

function labelFor(ev: BallEvent, batRuns: number, extraRuns: number): string {
  let base: string;
  switch (ev.extra) {
    case 'wide':
      base = extraRuns > 0 ? `Wd+${extraRuns}` : 'Wd';
      break;
    case 'noball': {
      const r = batRuns + extraRuns;
      base = r > 0 ? `Nb+${r}` : 'Nb';
      break;
    }
    case 'bye':
      base = `B${extraRuns}`;
      break;
    case 'legbye':
      base = `Lb${extraRuns}`;
      break;
    default:
      base = batRuns === 0 ? '.' : String(batRuns);
  }
  if (!ev.wicket) return base;
  return base === '.' ? 'W' : `${base}+W`;
}

/**
 * Derive the full innings state from the config and the ordered list of events.
 * Pure function: same input, same output. Throws InvalidEventError on an illegal event.
 */
export function computeInnings(
  config: InningsConfig,
  events: readonly InningsEvent[],
): InningsState {
  validateConfig(config);
  const { rules, battingTeam, bowlingTeam } = config;
  const n = battingTeam.players.length;
  const maxBalls = rules.oversPerInnings * rules.ballsPerOver;
  const maxWickets = rules.lastManStands ? n : n - 1;

  const batters = new Map<string, BatterStats>();
  const bowlers = new Map<string, BowlerStats>();

  const touchBatter = (name: string): BatterStats => {
    let b = batters.get(name);
    if (!b) {
      b = { name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      batters.set(name, b);
    }
    return b;
  };
  const touchBowler = (name: string): BowlerStats => {
    let b = bowlers.get(name);
    if (!b) {
      b = { name, legalBalls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };
      bowlers.set(name, b);
    }
    return b;
  };

  let striker = config.openers[0];
  let nonStriker: string | null = config.openers[1];
  touchBatter(striker);
  touchBatter(nonStriker);

  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
  let freeHit = false;
  let currentOver: BallSymbol[] = [];
  const completedOvers: BallSymbol[][] = [];
  let partnership = { runs: 0, balls: 0 };
  let status: InningsStatus = 'inProgress';

  const swapStrike = () => {
    if (nonStriker !== null) {
      const tmp: string = striker;
      striker = nonStriker;
      nonStriker = tmp;
    }
  };

  const updateStatus = () => {
    if (config.target !== undefined && runs >= config.target) status = 'targetChased';
    else if (wickets >= maxWickets) status = 'allOut';
    else if (legalBalls >= maxBalls) status = 'oversDone';
  };

  const applyBall = (ev: BallEvent) => {
    const batRuns = ev.batRuns ?? 0;
    const extraRuns = ev.extraRuns ?? 0;
    checkCount('batRuns', batRuns);
    checkCount('extraRuns', extraRuns);

    if (!bowlingTeam.players.includes(ev.bowler)) {
      fail(`bowler "${ev.bowler}" is not in ${bowlingTeam.name}`);
    }

    const extra = ev.extra;
    if ((extra === 'wide' || extra === 'bye' || extra === 'legbye') && batRuns > 0) {
      fail(`a ${extra} cannot have runs off the bat`);
    }
    if ((extra === 'bye' || extra === 'legbye') && extraRuns === 0) {
      fail(`a ${extra} needs at least 1 run`);
    }

    const penalty = extra === 'wide' ? rules.wideRuns : extra === 'noball' ? rules.noBallRuns : 0;
    const totalRuns = batRuns + extraRuns + penalty;
    const legal =
      extra === 'wide'
        ? !rules.widesReBowled
        : extra === 'noball'
          ? !rules.noBallsReBowled
          : true;

    // ----- validate the wicket before changing anything -----
    const w = ev.wicket;
    if (w) {
      if (w.playerOut !== striker && w.playerOut !== nonStriker) {
        fail(`"${w.playerOut}" is not at the crease`);
      }
      if (w.kind === 'lbw' && !rules.lbwEnabled) fail('LBW is switched off in this match');
      if (w.kind !== 'runout' && w.kind !== 'other') {
        if (freeHit) fail('on a free hit only a run-out is possible');
        if (extra === 'noball') fail('on a no-ball only a run-out is possible');
        if (extra === 'wide' && w.kind !== 'stumped' && w.kind !== 'hitwicket') {
          fail(`a batter cannot be out ${w.kind} off a wide`);
        }
      }
      if (w.kind !== 'runout' && (batRuns > 0 || extraRuns > 0)) {
        fail('runs do not count on a ball where the batter is out (except run-out)');
      }
    }

    // ----- runs, extras, batter and bowler stats -----
    const strikerStats = touchBatter(striker);
    const bowler = touchBowler(ev.bowler);

    runs += totalRuns;
    strikerStats.runs += batRuns;
    if (batRuns === 4) strikerStats.fours++;
    if (batRuns === 6) strikerStats.sixes++;
    if (extra !== 'wide') strikerStats.balls++;

    bowler.runs += batRuns;
    if (extra === 'wide') {
      extras.wides += penalty + extraRuns;
      bowler.runs += penalty + extraRuns;
      bowler.wides++;
    } else if (extra === 'noball') {
      extras.noBalls += penalty + extraRuns;
      bowler.runs += penalty;
      bowler.noBalls++;
    } else if (extra === 'bye') {
      extras.byes += extraRuns;
    } else if (extra === 'legbye') {
      extras.legByes += extraRuns;
    }

    if (legal) {
      legalBalls++;
      bowler.legalBalls++;
    }

    currentOver.push({
      label: labelFor(ev, batRuns, extraRuns),
      legal,
      runs: totalRuns,
      wicket: !!w,
      bowler: ev.bowler,
    });

    partnership.runs += totalRuns;
    if (legal) partnership.balls++;

    // free hit: set by a no-ball, kept through a wide, cleared by anything else
    if (extra === 'noball') freeHit = rules.freeHitOnNoBall;
    else if (extra !== 'wide') freeHit = false;

    // ----- strike changes for runs run -----
    if ((batRuns + extraRuns) % 2 === 1) swapStrike();

    // ----- wicket -----
    if (w) {
      wickets++;
      const out = touchBatter(w.playerOut);
      out.out = true;
      out.dismissal = {
        kind: w.kind,
        bowler: BOWLER_CREDIT.has(w.kind) ? ev.bowler : undefined,
        fielder: w.fielder,
        note: w.note,
      };
      if (BOWLER_CREDIT.has(w.kind)) bowler.wickets++;
      partnership = { runs: 0, balls: 0 };

      if (wickets < maxWickets) {
        const stillToBat = battingTeam.players.filter((p) => !batters.has(p));
        if (stillToBat.length > 0) {
          if (!w.incoming) fail('name the incoming batter (wicket.incoming)');
          if (!stillToBat.includes(w.incoming)) {
            fail(`"${w.incoming}" cannot come in (not in the team, or already batted)`);
          }
          touchBatter(w.incoming);
          if (striker === w.playerOut) striker = w.incoming;
          else nonStriker = w.incoming;
        } else if (rules.lastManStands) {
          // nobody left to come in: the remaining batter carries on alone
          if (striker === w.playerOut) striker = nonStriker as string;
          nonStriker = null;
        }
      }
    }

    // ----- end of over -----
    if (legal && legalBalls % rules.ballsPerOver === 0) {
      completedOvers.push(currentOver);
      currentOver = [];
      swapStrike();
    }

    updateStatus();
  };

  events.forEach((ev, i) => {
    try {
      if (status !== 'inProgress') fail(`the innings is already over (${status})`);
      if (ev.type === 'swapEnds') {
        if (nonStriker === null) fail('only one batter is left, nothing to swap');
        swapStrike();
      } else {
        applyBall(ev);
      }
    } catch (e) {
      if (e instanceof InvalidEventError) {
        throw new InvalidEventError(`Event #${i + 1}: ${e.message}`);
      }
      throw e;
    }
  });

  const bpo = rules.ballsPerOver;
  const round2 = (x: number) => Math.round(x * 100) / 100;
  const ballsLeft = Math.max(0, maxBalls - legalBalls);
  const runsNeeded = config.target === undefined ? undefined : Math.max(0, config.target - runs);

  return {
    runs,
    wickets,
    wicketsInHand: Math.max(0, maxWickets - wickets),
    legalBalls,
    overs: `${Math.floor(legalBalls / bpo)}.${legalBalls % bpo}`,
    extras: { ...extras, total: extras.wides + extras.noBalls + extras.byes + extras.legByes },
    striker,
    nonStriker,
    batters: [...batters.values()],
    bowlers: [...bowlers.values()],
    currentOver,
    completedOvers,
    freeHit,
    partnership,
    status,
    runRate: legalBalls > 0 ? round2(runs / (legalBalls / bpo)) : 0,
    target: config.target,
    runsNeeded,
    ballsLeft,
    requiredRate:
      runsNeeded !== undefined && ballsLeft > 0 ? round2(runsNeeded / (ballsLeft / bpo)) : undefined,
  };
}