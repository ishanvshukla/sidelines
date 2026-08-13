import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchArticlesByTeam, fetchArticlesBySport, fetchTopStories } from '../services/newsApi';
import { fetchNextGames } from '../services/scoresApi';
import { followedEntities } from '../constants/teams';
import type { Article, Prefs, SportId, Team } from '../types/news';

// Known non-news/shopping domains that may still slip through the backend filter
const BLOCKED_DOMAINS = new Set([
  'slickdeals.net', 'dealnews.com', 'bensbargains.net', 'fatwallet.com',
  'gottadeal.com', 'bradsdeals.com', 'techbargains.com', 'anrdoezrs.net',
  'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com',
  'fanatics.com', 'nbastore.eu', '9to5toys.com',
]);

// Title patterns that indicate a product listing or deal post rather than a news article
const DEAL_TITLE_RE = /\$\s*\d+|\d+\s*%\s*off|\bdeals?\b|\bcoupon\b|\bdiscount\b|\bpromo\s*code\b|\bfree\s*shipping\b|\bsale\b|\bshop\b|\bbuy\b/i;

function filterValidArticles(articles: Article[]): Article[] {
  return articles.filter((a) => {
    if (!a.title || a.title === '[Removed]' || a.url === 'https://removed.com') return false;

    try {
      const hostname = new URL(a.url).hostname.replace(/^www\./, '');
      if (BLOCKED_DOMAINS.has(hostname)) return false;
    } catch {
      return false;
    }

    if (DEAL_TITLE_RE.test(a.title)) return false;

    return true;
  });
}

export function useTopStories() {
  return useQuery({
    queryKey: ['topStories'],
    queryFn: async () => {
      const data = await fetchTopStories();
      return filterValidArticles(data.articles);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextGames(teams: Prefs['teams']) {
  const entities = followedEntities(teams);
  return useQuery({
    queryKey: ['nextGames', entities],
    queryFn: () => fetchNextGames(entities),
    enabled: entities.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

export function useSportNews(sportId: SportId) {
  return useQuery({
    queryKey: ['sport', sportId],
    queryFn: async () => {
      const data = await fetchArticlesBySport(sportId);
      return filterValidArticles(data.articles);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface TaggedArticle {
  article: Article;
  tag: string;
}

// One dedicated (long-cached, server-side) query per followed team/player,
// so a favorite team's articles show up reliably instead of depending on
// whether they happened to land in the shared sport-wide feed.
export function useTeamNews(sportId: SportId, teams: Team[]): { tagged: TaggedArticle[]; isLoading: boolean } {
  const results = useQueries({
    queries: teams.map((team) => ({
      queryKey: ['team', sportId, team.id],
      queryFn: async () => {
        const data = await fetchArticlesByTeam(sportId, team.id, team.searchTerm);
        return filterValidArticles(data.articles);
      },
      staleTime: 30 * 60 * 1000,
    })),
  });

  const tagged = results.flatMap((result, i) =>
    (result.data ?? []).map((article) => ({ article, tag: teams[i].name }))
  );
  const isLoading = teams.length > 0 && results.every((r) => r.isLoading);
  return { tagged, isLoading };
}
