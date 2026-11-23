import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import SavedMatchView from '../components/SavedMatchView';
import { useSession } from '../lib/auth';
import { removeMatch, setSharing } from '../lib/cloud';
import { db } from '../lib/db';
import type { SavedMatch } from '../lib/db';

const linkFor = (code: string) => `${window.location.origin}/m/${code}`;

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt('Copy this link:', text); // clipboard needs https, so fall back
  }
}

export default function History() {
  const matches = useLiveQuery(() => db.matches.orderBy('playedAt').reverse().toArray(), []);
  const { session, enabled } = useSession();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const share = async (m: SavedMatch) => {
    setNote(null);
    try {
      const code = m.shareCode ?? (await setSharing(m, true));
      if (code) {
        await copy(linkFor(code));
        setNote('Link copied. Anyone with it can view this match.');
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not share.');
    }
  };

  const unshare = async (m: SavedMatch) => {
    setNote(null);
    try {
      await setSharing(m, false);
      setNote('Sharing turned off. The old link no longer works.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not stop sharing.');
    }
  };

  const remove = async (m: SavedMatch) => {
    if (!confirm(`Delete ${m.teams[0]} vs ${m.teams[1]}? This cannot be undone.`)) return;
    setNote(null);
    try {
      await removeMatch(m);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl pt-6">
      <h1 className="text-5xl font-extrabold leading-none">History</h1>
      <p className="mt-3 text-muted">Every finished match. Tap one to see the scorecards.</p>

      {note && (
        <p role="status" className="mt-4 rounded-xl bg-accent p-3 font-bold text-black">
          {note}
        </p>
      )}

      {matches === undefined && <p className="mt-8 text-muted">Loading…</p>}

      {matches?.length === 0 && (
        <div className="card mt-8 text-center">
          <p className="text-2xl font-extrabold">No matches yet</p>
          <Link to="/new" className="btn btn-accent mt-4">
            Start a match
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {matches?.map((m) => (
          <section key={m.id} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xl font-extrabold">
                {m.teams[0]} vs {m.teams[1]}
              </p>
              <p className="text-sm font-bold text-muted">
                {m.syncedAt ? '☁ Saved in cloud' : 'On this device only'}
              </p>
            </div>
            <p className="font-bold">{m.resultSummary}</p>
            <p className="text-sm text-muted">{new Date(m.playedAt).toLocaleString()}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn px-3 py-1 text-sm"
                onClick={() => setOpenId(openId === m.id ? null : m.id)}
              >
                {openId === m.id ? 'Hide scorecard' : 'Scorecard'}
              </button>
              {enabled && session && (
                <>
                  <button className="btn px-3 py-1 text-sm" onClick={() => share(m)}>
                    {m.shareCode ? 'Copy link' : 'Share'}
                  </button>
                  {m.shareCode && (
                    <button className="btn px-3 py-1 text-sm" onClick={() => unshare(m)}>
                      Stop sharing
                    </button>
                  )}
                </>
              )}
              <button className="btn px-3 py-1 text-sm" onClick={() => remove(m)}>
                Delete
              </button>
            </div>

            {openId === m.id && (
              <div className="mt-4">
                <SavedMatchView summary={m.resultSummary} innings={m.innings} />
              </div>
            )}
          </section>
        ))}
      </div>

      {enabled && !session && (
        <p className="mt-8 text-center text-muted">
          <Link to="/account" className="font-bold underline">
            Sign in
          </Link>{' '}
          to back up your matches and share them.
        </p>
      )}
    </div>
  );
}