import { useState } from 'react';
import { SPORTS } from '../../constants/sports';

interface Props {
  activeFilter: string;
  onFilter: (id: string) => void;
}

export default function Header({ activeFilter, onFilter }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-espn-nav border-b border-espn-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-oswald font-bold text-2xl text-white tracking-tight">⚡</span>
            <span className="font-oswald font-bold text-2xl text-accent-red tracking-widest uppercase">
              SportsFeed
            </span>
          </div>
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
            All Sports
          </button>
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => onFilter(sport.id)}
              className={`px-4 py-2 font-oswald font-semibold uppercase text-sm tracking-wider transition-colors ${
                activeFilter === sport.id
                  ? 'border-b-2'
                  : 'text-gray-300 hover:text-white'
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

        {/* Mobile hamburger */}
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

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-espn-nav border-t border-espn-border px-4 py-2 flex flex-col gap-1">
          <button
            onClick={() => { onFilter('all'); setMenuOpen(false); }}
            className="text-left py-2 font-oswald uppercase text-sm text-gray-300 hover:text-white"
          >
            All Sports
          </button>
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => { onFilter(sport.id); setMenuOpen(false); }}
              className="text-left py-2 font-oswald uppercase text-sm"
              style={{ color: sport.color }}
            >
              {sport.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
