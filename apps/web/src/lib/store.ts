import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { computeInnings } from '@gully/core';
import type { InningsEvent } from '@gully/core';
import { describeMatch, emptyInnings } from './match';
import type { InningsRecord, LiveMatch, MatchSetup } from './types';

interface Store {
  match: LiveMatch | null;
  startMatch: (setup: MatchSetup) => void;
  startSecondInnings: () => void;
  /** Returns an error message if the event is not allowed, otherwise null. */
  score: (event: InningsEvent) => string | null;
  undo: () => void;
  redo: () => void;
  setBowler: (overIndex: number, name: string) => void;
  endInnings: () => void;
  discardMatch: () => void;
}

function updateCurrent(m: LiveMatch, fn: (r: InningsRecord) => InningsRecord): LiveMatch {
  const idx = m.innings.length - 1;
  return { ...m, innings: m.innings.map((r, i) => (i === idx ? fn(r) : r)) };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      match: null,

      startMatch: (setup) => set({ match: { setup, innings: [emptyInnings()] } }),

      startSecondInnings: () =>
        set((s) =>
          s.match && s.match.innings.length === 1
            ? { match: { ...s.match, innings: [...s.match.innings, emptyInnings()] } }
            : s,
        ),

      score: (event) => {
        const m = get().match;
        if (!m) return 'No match in progress';
        const view = describeMatch(m);
        if (view.status !== 'inProgress') return 'This innings is over';
        try {
          // the engine is the referee: it throws if the event is illegal
          computeInnings(view.config, [...view.record.events, event]);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'That is not allowed';
          return msg.replace(/^Event #\d+: /, '');
        }
        set({
          match: updateCurrent(m, (r) => ({ ...r, events: [...r.events, event], redo: [] })),
        });
        return null;
      },

      undo: () =>
        set((s) => {
          if (!s.match) return s;
          const cur = s.match.innings[s.match.innings.length - 1];
          const last = cur.events[cur.events.length - 1];
          if (!last) return s;
          return {
            match: updateCurrent(s.match, (r) => ({
              ...r,
              events: r.events.slice(0, -1),
              redo: [...r.redo, last],
              ended: false,
            })),
          };
        }),

      redo: () =>
        set((s) => {
          if (!s.match) return s;
          const cur = s.match.innings[s.match.innings.length - 1];
          const next = cur.redo[cur.redo.length - 1];
          if (!next) return s;
          return {
            match: updateCurrent(s.match, (r) => ({
              ...r,
              events: [...r.events, next],
              redo: r.redo.slice(0, -1),
            })),
          };
        }),

      setBowler: (overIndex, name) =>
        set((s) =>
          s.match
            ? {
                match: updateCurrent(s.match, (r) => ({
                  ...r,
                  bowlerByOver: { ...r.bowlerByOver, [overIndex]: name },
                })),
              }
            : s,
        ),

      endInnings: () =>
        set((s) =>
          s.match ? { match: updateCurrent(s.match, (r) => ({ ...r, ended: true })) } : s,
        ),

      discardMatch: () => set({ match: null }),
    }),
    {
      name: 'gully-live-match', // saved in localStorage so a refresh never loses the match
      version: 1,
      partialize: (s) => ({ match: s.match }),
    },
  ),
);