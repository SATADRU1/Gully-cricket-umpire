import type { InningsState } from './types';

export interface MatchResult {
  winner: string | null; // null = tie
  summary: string;
}

/** Runs the second team needs to win. */
export function targetFor(first: InningsState): number {
  return first.runs + 1;
}

/**
 * Result of a two-innings match. Returns null while the chase is still going.
 * A tie (winner = null) is where you start a super over: it is just two more
 * innings with oversPerInnings = 1 and fewer players.
 */
export function decideResult(
  first: InningsState,
  second: InningsState,
  names: { first: string; second: string },
): MatchResult | null {
  if (second.runs > first.runs) {
    const w = second.wicketsInHand;
    return {
      winner: names.second,
      summary: `${names.second} won by ${w} wicket${w === 1 ? '' : 's'}`,
    };
  }
  if (second.status === 'inProgress') return null;
  if (second.runs === first.runs) return { winner: null, summary: 'Match tied' };
  const diff = first.runs - second.runs;
  return {
    winner: names.first,
    summary: `${names.first} won by ${diff} run${diff === 1 ? '' : 's'}`,
  };
}