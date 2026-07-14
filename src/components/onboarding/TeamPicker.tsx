import { useState } from 'react';
import { SPORT_MAP } from '../../constants/sports';
import { SPORT_TEAMS } from '../../constants/teams';
import SportIcon from '../ui/SportIcon';
import PlayerCombobox from '../ui/PlayerCombobox';
import type { SportId, Prefs } from '../../types/news';

interface Props {
  sports: SportId[];
  initialTeams: Prefs['teams'];
  onConfirm: (teams: Prefs['teams']) => void;
  onBack: () => void;
}

export default function TeamPicker({ sports, initialTeams, onConfirm, onBack }: Props) {
  const [selected, setSelected] = useState<Prefs['teams']>(() => {
    const init: Prefs['teams'] = {};
    for (const id of sports) {
      init[id] = initialTeams[id] ?? [];
    }
    return init;
  });

  const sportsWithConfig = sports.filter((id) => SPORT_TEAMS[id]);

  return (
    <div className="min-h-screen bg-espn-dark px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <span className="font-display font-black italic text-3xl text-white tracking-wide uppercase">
            Side<span className="text-gold">lines</span>
          </span>
        </div>

        <div className="mb-2">
          <span className="text-xs font-oswald uppercase tracking-widest text-gold-dim">Step 2 of 2</span>
        </div>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-white uppercase tracking-wide mb-2">
          Pick your teams &amp; athletes
        </h1>
        <p className="text-gray-500 text-sm font-inter mb-10">
          Search or browse — select as many as you like. Skip any sport to see all its news.
        </p>

        {/* Sport sections */}
        <div className="flex flex-col gap-10">
          {sportsWithConfig.map((sportId) => {
            const sport = SPORT_MAP[sportId];
            const config = SPORT_TEAMS[sportId]!;
            const selectedForSport = selected[sportId] ?? [];

            return (
              <div key={sportId}>
                {/* Sport header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-0.5 h-7 rounded" style={{ backgroundColor: sport.color }} />
                    <span style={{ color: sport.color }}>
                      <SportIcon sportId={sport.id} size={18} />
                    </span>
                    <h2 className="font-heading font-black text-lg text-white uppercase tracking-wide">
                      {sport.label}
                    </h2>
                    {selectedForSport.length > 0 && (
                      <span
                        className="text-xs font-inter px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${sport.color}22`, color: sport.color }}
                      >
                        {selectedForSport.length} selected
                      </span>
                    )}
                  </div>
                  {selectedForSport.length > 0 && (
                    <button
                      onClick={() => setSelected((p) => ({ ...p, [sportId]: [] }))}
                      className="text-xs font-inter text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <PlayerCombobox
                  config={config}
                  selected={selectedForSport}
                  onChange={(ids) => setSelected((p) => ({ ...p, [sportId]: ids }))}
                  sportColor={sport.color}
                  sportLabel={sport.label}
                />

                {selectedForSport.length === 0 && (
                  <p className="text-xs text-gray-700 font-inter mt-2">
                    No selection — you'll see all {sport.label} news
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={onBack}
            className="font-oswald uppercase tracking-wider text-sm text-gray-500 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="font-oswald uppercase tracking-widest text-sm px-10 py-3 rounded-lg transition-all duration-150 bg-gold text-black hover:bg-gold-bright"
          >
            Start Reading →
          </button>
        </div>
      </div>
    </div>
  );
}
