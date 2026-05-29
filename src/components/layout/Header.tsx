import { useState } from 'react';
import { SPORT_MAP } from '../../constants/sports';
import type { SportId } from '../../types/news';

interface Props {
  activeFilter: string;
  onFilter: (id: string) => void;
  selectedSports: SportId[];
  onEditSports: () => void;
}

export default function Header({ activeFilter, onFilter, selectedSports, onEditSports }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sports = selectedSports.map((id) => SPORT_MAP[id]).filter(Boolean);

  return (
    <header className="sticky top-0 z-50 bg-espn-nav border-b border-espn-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="font-oswald font-bold text-2xl text-white tracking-tight">⚡</span>
          <span className="font-oswald font-bold text-2xl text-accent-red tracking-widest uppercase">
            SportsFeed
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onFilter('all')}
            className={`px-4 py-2 font-oswald font-semibold uppercase text-sm tracking-wider transition-colors ${
              activeFilter === 'all'
                ? 'text-accent-red border-b-2 border-accent-red'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            All
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => onFilter(sport.id)}
              className={`px-4 py-2 font-oswald font-semibold uppercase text-sm tracking-wider transition-colors ${
                activeFilter === sport.id ? 'border-b-2' : 'text-gray-300 hover:text-white'
              }`}
              style={
                activeFilter === sport.id
                  ? { color: sport.color, borderColor: sport.color }
                  : {}
              }
            >
              {sport.label}
            </button>
          ))}
        </nav>

        {/* Right side: edit button + mobile hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEditSports}
            title="Edit sports"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-espn-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-oswald text-xs uppercase tracking-wider"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Edit
          </button>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-espn-nav border-t border-espn-border px-4 py-2 flex flex-col gap-1">
          <button
            onClick={() => { onFilter('all'); setMenuOpen(false); }}
            className="text-left py-2 font-oswald uppercase text-sm text-gray-300 hover:text-white"
          >
            All Sports
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => { onFilter(sport.id); setMenuOpen(false); }}
              className="text-left py-2 font-oswald uppercase text-sm"
              style={{ color: sport.color }}
            >
              {sport.label}
            </button>
          ))}
          <button
            onClick={() => { onEditSports(); setMenuOpen(false); }}
            className="text-left py-2 font-oswald uppercase text-sm text-gray-400 hover:text-white border-t border-espn-border mt-1 pt-3"
          >
            Edit Sports
          </button>
        </div>
      )}
    </header>
  );
}
