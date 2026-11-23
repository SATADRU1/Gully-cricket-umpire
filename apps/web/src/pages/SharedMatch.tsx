import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SavedMatchView from '../components/SavedMatchView';
import { fetchShared } from '../lib/cloud';
import type { SharedRow } from '../lib/cloud';

/** Public page: anyone with the link can view the match, no login. */
export default function SharedMatch() {
  const { code } = useParams();
  const [row, setRow] = useState<SharedRow | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) {
      setState('missing');
      return;
    }
    fetchShared(code)
      .then((r) => {
        setRow(r);
        setState(r ? 'ok' : 'missing');
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setState('error');
      });
  }, [code]);

  return (
    <div className="mx-auto max-w-md pt-6">
      {state === 'loading' && <p className="text-muted">Loading match…</p>}

      {state === 'missing' && (
        <div className="card text-center">
          <p className="text-2xl font-extrabold">Match not found</p>
          <p className="mt-2 text-muted">The link may be wrong, or sharing was turned off.</p>
          <Link to="/" className="btn btn-accent mt-4">
            Go home
          </Link>
        </div>
      )}

      {state === 'error' && (
        <p role="alert" className="rounded-xl bg-hot p-3 font-bold text-white">
          {error}
        </p>
      )}

      {state === 'ok' && row && (
        <>
          <h1 className="text-4xl font-extrabold leading-tight">
            {row.teams[0]} vs {row.teams[1]}
          </h1>
          <p className="mb-5 text-sm text-muted">{new Date(row.played_at).toLocaleString()}</p>
          <SavedMatchView summary={row.result_summary} innings={row.innings} />
        </>
      )}
    </div>
  );
}