import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import SportSection from './components/sports/SportSection';
import NextGameWidget from './components/sports/NextGameWidget';
import SportPicker from './components/onboarding/SportPicker';
import TeamPicker from './components/onboarding/TeamPicker';
import AuthModal from './components/auth/AuthModal';

import type { SportId, Prefs } from './types/news';

const STORAGE_KEY = 'prefs';

function loadPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: Prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

type Step = 'pick-sports' | 'pick-teams' | 'main';

// Mounted only after auth/prefs loading is resolved
function AppContent() {
  const auth = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Prefer server prefs if logged in, otherwise fall back to localStorage
  const [prefs, setPrefs] = useState<Prefs | null>(() => {
    if (auth.isLoggedIn && auth.serverPrefs) return auth.serverPrefs;
    return loadPrefs();
  });
  const [step, setStep] = useState<Step>(() => {
    const initial = (auth.isLoggedIn && auth.serverPrefs) ? auth.serverPrefs : loadPrefs();
    return initial ? 'main' : 'pick-sports';
  });
  const [pendingSports, setPendingSports] = useState<SportId[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // When the user logs in during the session, apply their server prefs
  useEffect(() => {
    if (auth.serverPrefs) {
      setPrefs(auth.serverPrefs);
      savePrefs(auth.serverPrefs);
      setStep('main');
      setActiveFilter('all');
    }
  }, [auth.serverPrefs]);

  function handleSportsConfirm(sports: SportId[]) {
    setPendingSports(sports);
    setStep('pick-teams');
  }

  function handleTeamsConfirm(teams: Prefs['teams']) {
    const newPrefs: Prefs = { sports: pendingSports, teams };
    savePrefs(newPrefs);
    setPrefs(newPrefs);
    setStep('main');
    setActiveFilter('all');
    if (auth.isLoggedIn) {
      auth.syncPrefs(newPrefs).catch(() => {
        // localStorage already saved; server sync failed silently
      });
    }
  }

  function handleEdit() {
    setPendingSports(prefs?.sports ?? []);
    setStep('pick-sports');
  }

  if (step === 'pick-sports') {
    return (
      <>
        <SportPicker onConfirm={handleSportsConfirm} initial={prefs?.sports ?? []} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  if (step === 'pick-teams') {
    return (
      <>
        <TeamPicker
          sports={pendingSports}
          initialTeams={prefs?.teams ?? {}}
          onConfirm={handleTeamsConfirm}
          onBack={() => setStep('pick-sports')}
        />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  const sports = prefs!.sports;
  const visibleSports =
    activeFilter === 'all'
      ? sports
      : sports.includes(activeFilter as SportId)
        ? [activeFilter as SportId]
        : sports;

  return (
    <div className="min-h-screen bg-espn-dark font-inter">
      <Header
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
        selectedSports={sports}
        onEditSports={handleEdit}
        onSignIn={() => setShowAuthModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        {activeFilter === 'all' && (
          <div className="pt-6 pb-2">
            <div className="flex items-center gap-2 mb-0">
              <div className="h-px flex-1 bg-gradient-to-r from-espn-border to-gold-subtle" />
              <span className="font-oswald text-xs uppercase tracking-widest text-gold-dim px-3">
                Latest by Sport
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-espn-border to-gold-subtle" />
            </div>
          </div>
        )}
        <div className="lg:flex lg:items-start lg:gap-6">
          <div className="flex-1 min-w-0">
            {visibleSports.map((sportId) => (
              <SportSection
                key={sportId}
                sportId={sportId}
                teamIds={prefs!.teams[sportId] ?? []}
              />
            ))}
          </div>
          <aside className="hidden lg:block w-72 shrink-0 sticky top-20 pt-10">
            <NextGameWidget teams={prefs!.teams} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-espn-border py-6 text-center text-gray-600 text-xs font-inter">
        <p>
          Powered by{' '}
          <a
            href="https://newsapi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 underline"
          >
            NewsAPI.org
          </a>
          {' — '}Data is for personal/development use only.
        </p>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function AppInner() {
  const { prefsLoading } = useAuth();

  if (prefsLoading) {
    return (
      <div className="min-h-screen bg-espn-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="font-display font-black italic text-2xl text-white tracking-wide uppercase">
            Side<span className="text-gold">lines</span>
          </span>
          <span className="text-gray-600 font-oswald uppercase text-xs tracking-widest animate-pulse">
            Loading…
          </span>
        </div>
      </div>
    );
  }

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
