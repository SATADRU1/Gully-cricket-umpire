import { NavLink, Route, Routes } from 'react-router-dom';
import { content } from './content';
import { useTheme } from './lib/theme';
import { useStore } from './lib/store';
import Home from './pages/Home';
import Score from './pages/Score';
import Setup from './pages/Setup';
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

function Header() {
  const { dark, toggle } = useTheme();
  const hasMatch = useStore((s) => s.match !== null);
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 font-bold transition ${
      isActive ? 'bg-ink text-paper' : 'hover:bg-accent hover:text-black'
    }`;
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <NavLink to="/" className="text-xl font-extrabold tracking-tight">
          🏏 {content.brand}
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
          <button
            onClick={toggle}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink transition hover:bg-accent hover:text-black"
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
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<Setup />} />
          <Route path="/match" element={<Score />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}