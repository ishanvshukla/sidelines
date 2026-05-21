import { useState } from 'react';
import Ticker from './components/layout/Ticker';
import Header from './components/layout/Header';
import HeroCarousel from './components/hero/HeroCarousel';
import SportSection from './components/sports/SportSection';
import type { SportId } from './types/news';
import { SPORTS } from './constants/sports';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

function NoApiKeyBanner() {
  return (
    <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-6 py-4 text-sm font-inter">
      <strong className="font-oswald uppercase tracking-wide">Setup required:</strong>{' '}
      Add your NewsAPI key to a <code className="bg-black/30 px-1 rounded">.env</code> file as{' '}
      <code className="bg-black/30 px-1 rounded">VITE_NEWS_API_KEY=your_key</code>.
      Get a free key at{' '}
      <a
        href="https://newsapi.org"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-yellow-100"
      >
        newsapi.org
      </a>
      , then restart the dev server.
    </div>
  );
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const visibleSports = activeFilter === 'all'
    ? SPORTS.map((s) => s.id as SportId)
    : [activeFilter as SportId];

  return (
    <div className="min-h-screen bg-espn-dark font-inter">
      {/* Breaking news ticker */}
      <Ticker />

      {/* Sticky header */}
      <Header activeFilter={activeFilter} onFilter={setActiveFilter} />

      {/* API key warning */}
      {!API_KEY && <NoApiKeyBanner />}

      {/* Hero carousel */}
      {(activeFilter === 'all') && <HeroCarousel />}

      {/* Sport sections */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {(activeFilter === 'all') && (
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
          <SportSection key={sportId} sportId={sportId} />
        ))}
      </main>

      {/* Footer */}
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
