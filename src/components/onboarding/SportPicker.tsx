import { useState } from 'react';
import { SPORTS } from '../../constants/sports';
import type { SportId } from '../../types/news';

const SPORT_ICONS: Record<SportId, string> = {
  tennis: '🎾',
  basketball: '🏀',
  cricket: '🏏',
  soccer: '⚽',
  nfl: '🏈',
  'ncaa-basketball': '🏀',
  formula1: '🏎️',
  'ncaa-football': '🏈',
};

interface Props {
  onConfirm: (selected: SportId[]) => void;
  initial?: SportId[];
}

export default function SportPicker({ onConfirm, initial = [] }: Props) {
  const [selected, setSelected] = useState<Set<SportId>>(new Set(initial));

  function toggle(id: SportId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-espn-dark flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <span className="font-oswald font-bold text-3xl text-white tracking-tight">⚡</span>
        <span className="font-oswald font-bold text-3xl text-accent-red tracking-widest uppercase">
          SportsFeed
        </span>
      </div>

      {/* Heading */}
      <h1 className="font-oswald font-bold text-3xl md:text-4xl text-white uppercase tracking-wide text-center mb-2">
        What sports do you follow?
      </h1>
      <p className="text-gray-400 text-sm font-inter mb-10 text-center">
        Select all that interest you — you can change this any time.
      </p>

      {/* Sport grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-3xl mb-10">
        {SPORTS.map((sport) => {
          const isSelected = selected.has(sport.id);
          return (
            <button
              key={sport.id}
              onClick={() => toggle(sport.id)}
              className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 py-7 px-4 transition-all duration-150 focus:outline-none"
              style={{
                borderColor: isSelected ? sport.color : '#2a2a4a',
                backgroundColor: isSelected ? `${sport.color}18` : '#16213e',
              }}
            >
              {isSelected && (
                <span
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: sport.color, color: '#0d0d14' }}
                >
                  ✓
                </span>
              )}
              <span className="text-4xl leading-none">{SPORT_ICONS[sport.id]}</span>
              <span
                className="font-oswald font-semibold text-sm uppercase tracking-wide text-center leading-tight"
                style={{ color: isSelected ? sport.color : '#d1d5db' }}
              >
                {sport.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        disabled={selected.size === 0}
        onClick={() => onConfirm([...selected])}
        className="font-oswald font-bold uppercase tracking-widest text-sm px-10 py-3 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          backgroundColor: selected.size > 0 ? '#cc0000' : '#4b5563',
          color: 'white',
        }}
      >
        {selected.size === 0
          ? 'Select at least one sport'
          : `Start Reading — ${selected.size} sport${selected.size > 1 ? 's' : ''} selected`}
      </button>
    </div>
  );
}
