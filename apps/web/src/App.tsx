import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { content } from './content';
import { useSession } from './lib/auth';
import { syncNow } from './lib/cloud';
import { useStore } from './lib/store';
import { useTheme } from './lib/theme';
import Account from './pages/Account';
import History from './pages/History';
import Home from './pages/Home';
import Score from './pages/Score';
import Setup from './pages/Setup';
import SharedMatch from './pages/SharedMatch';
import Stats from './pages/Stats';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function Header() {
  const { dark, toggle } = useTheme();
  const { session } = useSession();
  const hasMatch = useStore((s) => s.match !== null);
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-2 py-1.5 text-sm font-bold transition sm:px-3 sm:text-base ${
      isActive ? 'bg-ink text-paper' : 'hover:bg-accent hover:text-black'
    }`;
  const iconBtn =
    'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink transition hover:bg-accent hover:text-black';
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <NavLink to="/" className="text-xl font-extrabold tracking-tight">
          🏏<span className="hidden sm:inline"> {content.brand}</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {hasMatch && (
            <NavLink to="/match" className={link}>
              Match
            </NavLink>
          )}
          <NavLink to="/stats" className={link}>
            Stats
          </NavLink>
          <NavLink to="/history" className={link}>
            History
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) => `${iconBtn} ${isActive ? 'bg-ink text-paper' : ''}`}
            aria-label={session ? 'Account' : 'Sign in'}
            title={session ? (session.user.email ?? 'Account') : 'Sign in'}
          >
            <PersonIcon />
          </NavLink>
          <button
            onClick={toggle}
            className={iconBtn}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const { session } = useSession();
  const userId = session?.user.id;

  // when signed in, quietly sync matches in the background
  useEffect(() => {
    if (userId) syncNow().catch(() => {});
  }, [userId]);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<Setup />} />
          <Route path="/match" element={<Score />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/history" element={<History />} />
          <Route path="/account" element={<Account />} />
          <Route path="/m/:code" element={<SharedMatch />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}