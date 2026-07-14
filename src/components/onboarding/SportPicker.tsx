import { useState } from 'react';
import { SPORTS } from '../../constants/sports';
import SportIcon from '../ui/SportIcon';
import type { SportId } from '../../types/news';

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
      <div className="flex items-center gap-2.5 mb-10">
        <span className="font-display font-black italic text-5xl text-white tracking-wide uppercase">
          Side<span className="text-gold">lines</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-2 text-center">
        <span className="text-xs font-oswald font-semibold uppercase tracking-widest text-gold-dim">Step 1 of 2</span>
      </div>
      <h1 className="font-heading font-black text-4xl md:text-5xl text-white uppercase tracking-wide text-center mb-2">
        What sports do you follow?
      </h1>
      <p className="text-gray-500 text-sm font-inter mb-10 text-center">
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
                borderColor: isSelected ? sport.color : '#1e1a08',
                backgroundColor: isSelected ? `${sport.color}18` : '#111111',
              }}
            >
              {isSelected && (
                <span
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: sport.color, color: '#080808' }}
                >
                  ✓
                </span>
              )}
              <span style={{ color: isSelected ? sport.color : '#555545' }}>
                <SportIcon sportId={sport.id} size={36} />
              </span>
              <span
                className="font-heading font-black text-sm uppercase tracking-wide text-center leading-tight"
                style={{ color: isSelected ? sport.color : '#9ca3af' }}
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
          backgroundColor: selected.size > 0 ? '#c9a227' : '#2a2a2a',
          color: selected.size > 0 ? '#080808' : '#666',
        }}
      >
        {selected.size === 0
          ? 'Select at least one sport'
          : `Next — ${selected.size} sport${selected.size > 1 ? 's' : ''} selected →`}
      </button>
    </div>
  );
}
