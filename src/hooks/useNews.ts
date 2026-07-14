import { useQuery } from '@tanstack/react-query';
import { fetchArticlesBySport, fetchTopStories } from '../services/newsApi';
import { fetchNextGames } from '../services/scoresApi';
import { allItemsForSport, followedEntities } from '../constants/teams';
import type { Article, Prefs, SportId } from '../types/news';

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

export function useSportNews(sportId: SportId, teamIds: string[] = []) {
  const allItems = allItemsForSport(sportId);
  const searchTerms = teamIds
    .map((id) => allItems.find((t) => t.id === id)?.searchTerm)
    .filter((t): t is string => !!t);

  return useQuery({
    queryKey: ['sport', sportId, teamIds],
    queryFn: async () => {
      const data = await fetchArticlesBySport(sportId, searchTerms);
      return filterValidArticles(data.articles);
    },
    staleTime: 5 * 60 * 1000,
  });
}
