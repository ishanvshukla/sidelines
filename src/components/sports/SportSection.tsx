import type { SportId, Article } from '../../types/news';
import { SPORT_MAP } from '../../constants/sports';
import { useSportNews } from '../../hooks/useNews';
import { allItemsForSport } from '../../constants/teams';
import ArticleCard from './ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import SportIcon from '../ui/SportIcon';

interface Props {
  sportId: SportId;
  teamIds: string[];
}

export default function SportSection({ sportId, teamIds }: Props) {
  const sport = SPORT_MAP[sportId];
  const { data: articles, isLoading, isError, refetch, isRefetching } = useSportNews(sportId, teamIds);

  const selectedItems = teamIds.length > 0
    ? allItemsForSport(sportId).filter((item) => teamIds.includes(item.id))
    : [];

  function detectTag(article: Article): string | null {
    if (selectedItems.length === 0) return null;
    const haystack = `${article.title} ${article.description ?? ''}`.toLowerCase();
    for (const item of selectedItems) {
      if (
        haystack.includes(item.name.toLowerCase()) ||
        haystack.includes(item.searchTerm.toLowerCase())
      ) {
        return item.name;
      }
    }
    return null;
  }

  return (
    <section className="pt-10" id={sportId}>
      <div className="flex items-center gap-3 mb-5">
        <span style={{ color: sport.color }} className="flex">
          <SportIcon sportId={sport.id} size={22} />
        </span>
        <h2 className="font-heading font-black text-2xl text-chalk uppercase tracking-wide">
          {sport.label}
        </h2>
        <div className="flex-1 h-px bg-espn-border" />
        <span className="font-oswald font-semibold text-xs uppercase tracking-[0.18em] text-gold-dim hidden sm:block">
          Latest
        </span>
      </div>

      {isError ? (
        <div className="bg-espn-card border border-espn-border rounded p-8 text-center">
          <p className="font-oswald text-lg text-stone uppercase tracking-wide mb-1">
            Couldn't load {sport.label} headlines
          </p>
          <p className="text-stone/70 text-sm font-inter mb-4">
            The news service isn't responding right now. Stories reappear automatically once it recovers.
          </p>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="font-oswald font-semibold uppercase tracking-[0.18em] text-xs px-6 py-2 rounded border border-gold-dim text-gold hover:text-gold-bright hover:border-gold transition-colors disabled:opacity-50"
          >
            {isRefetching ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {isLoading ? (
            <>
              <div className="sm:col-span-2 sm:row-span-2 hidden sm:block">
                <SkeletonCard tall />
              </div>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </>
          ) : (
            articles?.slice(0, 9).map((article, i) => (
              <ArticleCard
                key={article.url}
                article={article}
                sport={sport}
                tagLabel={detectTag(article)}
                variant={i === 0 ? 'hero' : 'compact'}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
