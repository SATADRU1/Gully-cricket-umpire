import { useState } from 'react';
import { Label, Segmented } from '../components/ui';
import { useSession } from '../lib/auth';
import { syncNow } from '../lib/cloud';
import { supabase } from '../lib/supabase';

type Msg = { kind: 'ok' | 'err'; text: string };

export default function Account() {
  const { session, loading, enabled } = useSession();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  if (!enabled || !supabase) {
    return (
      <div className="mx-auto max-w-xl pt-6">
        <h1 className="text-5xl font-extrabold leading-none">Account</h1>
        <div className="card mt-6">
          <p className="text-xl font-extrabold">Cloud is not set up yet</p>
          <p className="mt-2 text-muted">
            The app works fine without it, but your matches stay on this device. To turn on cloud
            history, create <code>apps/web/.env.local</code> with your Supabase URL and publishable key,
            then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  const client = supabase;

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const creds = { email: email.trim(), password };
    const { data, error } =
      mode === 'in'
        ? await client.auth.signInWithPassword(creds)
        : await client.auth.signUp(creds);
    setBusy(false);
    if (error) {
      setMsg({ kind: 'err', text: error.message });
      return;
    }
    if (mode === 'up' && !data.session) {
      setMsg({ kind: 'ok', text: 'Check your email to confirm your account, then sign in.' });
    }
  };

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await syncNow();
      setMsg({ kind: 'ok', text: `Done. Uploaded ${r.uploaded}, downloaded ${r.downloaded}.` });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Sync failed.' });
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md pt-6">
      <h1 className="text-5xl font-extrabold leading-none">Account</h1>

      {loading && <p className="mt-6 text-muted">Loading…</p>}

      {!loading && session && (
        <div className="card mt-6 grid gap-3">
          <p className="text-sm font-extrabold uppercase tracking-wide text-muted">Signed in as</p>
          <p className="break-all text-xl font-extrabold">{session.user.email}</p>
          <button className="btn btn-accent" onClick={sync} disabled={busy}>
            {busy ? 'Working…' : 'Sync matches now'}
          </button>
          <button className="btn" onClick={() => client.auth.signOut()} disabled={busy}>
            Sign out
          </button>
        </div>
      )}

      {!loading && !session && (
        <div className="mt-6">
          <Segmented
            options={[
              { value: 'in' as const, label: 'Sign in' },
              { value: 'up' as const, label: 'Create account' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Label>Email</Label>
          <input
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Label>Password (6+ characters)</Label>
          <input
            className="field"
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="btn btn-ink mt-6 w-full text-lg"
            onClick={submit}
            disabled={busy || !email || password.length < 6}
          >
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      )}

      {msg && (
        <p
          role="alert"
          className={`mt-5 rounded-xl p-3 font-bold ${
            msg.kind === 'ok' ? 'bg-accent text-black' : 'bg-hot text-white'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}