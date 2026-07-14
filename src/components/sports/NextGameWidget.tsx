import { useState } from 'react';
import { format } from 'date-fns';
import { useNextGames } from '../../hooks/useNews';
import type { NextGame, Prefs } from '../../types/news';

/** TheSportsDB timestamps are UTC without a zone suffix. */
function kickoff(ts: string | null): string | null {
  if (!ts) return null;
  const date = new Date(ts.endsWith('Z') ? ts : `${ts}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'EEE d MMM · h:mm a');
}

function TeamRow({ name, badge, score, followed }: {
  name: string;
  badge: string | null;
  score: string | null;
  followed: boolean;
}) {
  const [badgeError, setBadgeError] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {badge && !badgeError ? (
        <img src={badge} alt="" className="w-5 h-5 object-contain" onError={() => setBadgeError(true)} loading="lazy" />
      ) : (
        <span className="w-5 h-5 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-espn-border" />
        </span>
      )}
      <span className={`text-sm truncate ${followed ? 'text-chalk font-semibold' : 'text-stone'}`}>
        {name}
      </span>
      {score != null && (
        <span className="ml-auto font-oswald font-bold text-sm text-chalk">{score}</span>
      )}
    </div>
  );
}

function GameRow({ game }: { game: NextGame }) {
  // Name the followed player when they aren't literally a team name (e.g. Mbappé → Real Madrid)
  const followedPeople = game.follows.filter((f) => f !== game.home && f !== game.away);
  const when = kickoff(game.timestamp);

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="font-oswald font-semibold text-[10px] uppercase tracking-[0.18em] text-gold-dim truncate">
          {game.league}
        </span>
        {followedPeople.length > 0 && (
          <span className="font-oswald font-semibold text-[10px] uppercase tracking-[0.08em] text-gold truncate">
            {followedPeople.join(' · ')}
          </span>
        )}
      </div>
      {game.home && game.away ? (
        <div className="space-y-1.5 mb-2">
          <TeamRow name={game.home} badge={game.homeBadge} score={game.homeScore} followed={game.followedSide === 'home'} />
          <TeamRow name={game.away} badge={game.awayBadge} score={game.awayScore} followed={game.followedSide === 'away'} />
        </div>
      ) : (
        // Races, fight cards and other events without a home/away pairing
        <p className="text-sm text-chalk font-semibold mb-2">{game.name}</p>
      )}
      {when && (
        <p className="text-[11px] text-stone/80 font-inter">
          {when}
          {game.venue ? ` · ${game.venue}` : ''}
        </p>
      )}
    </li>
  );
}

export default function NextGameWidget({ teams }: { teams: Prefs['teams'] }) {
  const { data: games } = useNextGames(teams);
  if (!games?.length) return null;

  return (
    <div className="bg-espn-card border border-espn-border rounded overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-espn-border">
        <div className="w-1 h-4 bg-gold" />
        <h2 className="font-heading font-black text-sm text-chalk uppercase tracking-[0.08em]">
          Up next
        </h2>
        <span className="ml-auto font-oswald font-semibold text-[10px] uppercase tracking-[0.18em] text-gold-dim">
          Your picks
        </span>
      </div>
      <ul className="divide-y divide-espn-border">
        {games.map((game) => (
          <GameRow key={`${game.name ?? `${game.home}-${game.away}`}-${game.timestamp}`} game={game} />
        ))}
      </ul>
    </div>
  );
}
