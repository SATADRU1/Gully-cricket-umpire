import { db } from './db';
import type { SavedMatch } from './db';
import { supabase } from './supabase';

interface MatchRow {
  id: string;
  played_at: string;
  result_summary: string;
  winner: string | null;
  teams: [string, string];
  innings: SavedMatch['innings'];
  share_code: string | null;
}

export type SharedRow = Omit<MatchRow, 'share_code'>;

const toRow = (m: SavedMatch) => ({
  id: m.id,
  played_at: new Date(m.playedAt).toISOString(),
  result_summary: m.resultSummary,
  winner: m.winner,
  teams: m.teams,
  innings: m.innings,
  share_code: m.shareCode ?? null,
});

const fromRow = (r: MatchRow): SavedMatch => ({
  id: r.id,
  playedAt: new Date(r.played_at).getTime(),
  resultSummary: r.result_summary,
  winner: r.winner,
  teams: r.teams,
  innings: r.innings,
  shareCode: r.share_code ?? undefined,
  syncedAt: Date.now(),
});

async function signedIn(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

/** Upload one match after it is saved. Returns false (never throws) if offline or signed out. */
export async function pushMatch(m: SavedMatch): Promise<boolean> {
  try {
    if (!supabase || !(await signedIn())) return false;
    const { error } = await supabase.from('matches').upsert(toRow(m));
    if (error) return false;
    await db.matches.update(m.id, { syncedAt: Date.now() });
    return true;
  } catch {
    return false;
  }
}

/** Two-way sync: upload matches the cloud lacks, download matches this device lacks. */
export async function syncNow(): Promise<{ uploaded: number; downloaded: number }> {
  if (!supabase) throw new Error('Cloud is not set up on this build.');
  if (!(await signedIn())) throw new Error('Sign in first.');

  const local = await db.matches.toArray();
  const { data: remote, error } = await supabase.from('matches').select('id');
  if (error) throw new Error(error.message);

  const remoteIds = new Set((remote ?? []).map((r: { id: string }) => r.id));
  const localIds = new Set(local.map((m) => m.id));

  let uploaded = 0;
  for (const m of local) {
    if (!remoteIds.has(m.id) && (await pushMatch(m))) uploaded++;
  }

  const missing = [...remoteIds].filter((id) => !localIds.has(id));
  let downloaded = 0;
  if (missing.length > 0) {
    const { data, error: e2 } = await supabase.from('matches').select('*').in('id', missing);
    if (e2) throw new Error(e2.message);
    const rows = (data ?? []) as MatchRow[];
    await db.matches.bulkPut(rows.map(fromRow));
    downloaded = rows.length;
  }
  return { uploaded, downloaded };
}

const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alike letters
export function makeShareCode(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

/** Turn the public link on or off. Returns the share code, or null when switched off. */
export async function setSharing(m: SavedMatch, on: boolean): Promise<string | null> {
  if (!supabase) throw new Error('Cloud is not set up on this build.');
  if (!(await signedIn())) throw new Error('Sign in to share matches.');
  const code = on ? (m.shareCode ?? makeShareCode()) : null;
  const next: SavedMatch = { ...m, shareCode: code ?? undefined };
  const { error } = await supabase.from('matches').upsert(toRow(next));
  if (error) throw new Error(error.message);
  await db.matches.update(m.id, { shareCode: code ?? undefined, syncedAt: Date.now() });
  return code;
}

/** Delete here, and in the cloud too if a cloud copy exists. */
export async function removeMatch(m: SavedMatch): Promise<void> {
  if (supabase && m.syncedAt) {
    if (!(await signedIn())) throw new Error('Sign in to delete a match that is saved in the cloud.');
    const { error } = await supabase.from('matches').delete().eq('id', m.id);
    if (error) throw new Error(error.message);
  }
  await db.matches.delete(m.id);
}

/** Public read of one shared match. No login needed. */
export async function fetchShared(code: string): Promise<SharedRow | null> {
  if (!supabase) throw new Error('Cloud is not set up on this build.');
  const { data, error } = await supabase.rpc('get_shared_match', { p_code: code });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as SharedRow[];
  return rows[0] ?? null;
}