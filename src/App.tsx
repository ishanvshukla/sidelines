import { useState } from 'react';
import Header from './components/layout/Header';
import SportSection from './components/sports/SportSection';
import SportPicker from './components/onboarding/SportPicker';
import TeamPicker from './components/onboarding/TeamPicker';
import type { SportId, Prefs } from './types/news';

const STORAGE_KEY = 'prefs';

function loadPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: Prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

type Step = 'pick-sports' | 'pick-teams' | 'main';

export default function App() {
  const [prefs, setPrefs] = useState<Prefs | null>(loadPrefs);
  const [step, setStep] = useState<Step>(() => (loadPrefs() ? 'main' : 'pick-sports'));
  const [pendingSports, setPendingSports] = useState<SportId[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

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
  }

  function handleEdit() {
    setPendingSports(prefs?.sports ?? []);
    setStep('pick-sports');
  }

  if (step === 'pick-sports') {
    return (
      <SportPicker
        onConfirm={handleSportsConfirm}
        initial={prefs?.sports ?? []}
      />
    );
  }

  if (step === 'pick-teams') {
    return (
      <TeamPicker
        sports={pendingSports}
        initialTeams={prefs?.teams ?? {}}
        onConfirm={handleTeamsConfirm}
        onBack={() => setStep('pick-sports')}
      />
    );
  }

  const sports = prefs!.sports;
  const visibleSports = activeFilter === 'all'
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
      />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        {activeFilter === 'all' && (
          <div className="pt-6 pb-2">
            <div className="flex items-center gap-2 mb-0">
              <div className="h-px flex-1 bg-espn-border" />
              <span className="font-oswald text-xs uppercase tracking-widest text-gray-500 px-3">
                Latest by Sport
              </span>
              <div className="h-px flex-1 bg-espn-border" />
            </div>
          </div>
        )}
        {visibleSports.map((sportId) => (
          <SportSection
            key={sportId}
            sportId={sportId}
            teamIds={prefs!.teams[sportId] ?? []}
          />
        ))}
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
    </div>
  );
}
