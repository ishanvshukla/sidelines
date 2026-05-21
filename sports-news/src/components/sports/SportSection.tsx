import type { SportId } from '../../types/news';
import { SPORT_MAP } from '../../constants/sports';
import { useSportNews } from '../../hooks/useNews';
import ArticleCard from './ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';

interface Props {
  sportId: SportId;
}

export default function SportSection({ sportId }: Props) {
  const sport = SPORT_MAP[sportId];
  const { data: articles, isLoading, isError } = useSportNews(sportId);

  const icon = sportId === 'tennis' ? '🎾' : sportId === 'basketball' ? '🏀' : '🏏';

  return (
    <section className="py-8" id={sportId}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded" style={{ backgroundColor: sport.color }} />
          <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">
            <span className="mr-2">{icon}</span>
            {sport.label}
          </h2>
        </div>
        <span className="font-oswald text-xs font-semibold uppercase tracking-widest text-gray-500 hidden sm:block">
          Latest News
        </span>
      </div>

      {/* Grid */}
      {isError ? (
        <div className="bg-espn-card rounded-lg p-8 text-center text-gray-500">
          <p className="font-oswald text-lg">Failed to load {sport.label} news</p>
          <p className="text-sm mt-1">Check your API key in the .env file</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : articles?.slice(0, 8).map((article) => (
                <ArticleCard key={article.url} article={article} sport={sport} />
              ))}
        </div>
      )}
    </section>
  );
}
