import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { InningsConfig, InningsEvent } from '@gully/core';

export interface SavedMatch {
  id: string;
  playedAt: number;
  resultSummary: string;
  winner: string | null;
  teams: [string, string];
  innings: { config: InningsConfig; events: InningsEvent[] }[];
  shareCode?: string; // set when the match has a public share link
  syncedAt?: number; // set when a copy exists in the cloud
}

export const db = new Dexie('gully-umpire') as Dexie & { matches: Table<SavedMatch, string> };

db.version(1).stores({
  matches: 'id, playedAt',
});