import { useState } from 'react';
import { SPORT_MAP } from '../../constants/sports';
import { SPORT_TEAMS } from '../../constants/teams';
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

  function toggle(sportId: SportId, teamId: string) {
    setSelected((prev) => {
      const current = prev[sportId] ?? [];
      const next = current.includes(teamId)
        ? current.filter((t) => t !== teamId)
        : [...current, teamId];
      return { ...prev, [sportId]: next };
    });
  }

  const sportsWithTeams = sports.filter((id) => SPORT_TEAMS[id]);

  return (
    <div className="min-h-screen bg-espn-dark px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-oswald font-bold text-2xl text-white tracking-tight">⚡</span>
          <span className="font-oswald font-bold text-2xl text-accent-red tracking-widest uppercase">
            SportsFeed
          </span>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-oswald uppercase tracking-widest text-gray-500">Step 2 of 2</span>
        </div>
        <h1 className="font-oswald font-bold text-3xl md:text-4xl text-white uppercase tracking-wide mb-2">
          Pick your teams
        </h1>
        <p className="text-gray-400 text-sm font-inter mb-10">
          Select specific teams to follow, or skip any sport to see all its news.
        </p>

        {/* Sport sections */}
        <div className="flex flex-col gap-10">
          {sportsWithTeams.map((sportId) => {
            const sport = SPORT_MAP[sportId];
            const config = SPORT_TEAMS[sportId]!;
            const selectedForSport = selected[sportId] ?? [];

            return (
              <div key={sportId}>
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded" style={{ backgroundColor: sport.color }} />
                    <h2 className="font-oswald font-bold text-lg text-white uppercase tracking-wide">
                      {sport.icon} {sport.label}
                    </h2>
                    <span className="text-xs font-inter text-gray-500">— {config.entityLabel}</span>
                  </div>
                  {selectedForSport.length > 0 && (
                    <button
                      onClick={() => setSelected((p) => ({ ...p, [sportId]: [] }))}
                      className="text-xs font-inter text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Team grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {config.teams.map((team) => {
                    const isSelected = selectedForSport.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => toggle(sportId, team.id)}
                        className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-100 focus:outline-none"
                        style={{
                          borderColor: isSelected ? sport.color : '#2a2a4a',
                          backgroundColor: isSelected ? `${sport.color}18` : '#16213e',
                        }}
                      >
                        {isSelected && (
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: sport.color, color: '#0d0d14' }}
                          >
                            ✓
                          </span>
                        )}
                        <span
                          className="font-inter text-sm leading-tight"
                          style={{ color: isSelected ? sport.color : '#d1d5db' }}
                        >
                          {team.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedForSport.length === 0 && (
                  <p className="text-xs text-gray-600 font-inter mt-2">
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
            className="font-oswald uppercase tracking-wider text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="font-oswald font-bold uppercase tracking-widest text-sm px-10 py-3 rounded-lg transition-all duration-150"
            style={{ backgroundColor: '#cc0000', color: 'white' }}
          >
            Start Reading →
          </button>
        </div>
      </div>
    </div>
  );
}
