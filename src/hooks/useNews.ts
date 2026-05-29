import { useQuery } from '@tanstack/react-query';
import { fetchArticlesBySport, fetchTopStories } from '../services/newsApi';
import { SPORT_TEAMS } from '../constants/teams';
import type { Article, SportId } from '../types/news';

function filterValidArticles(articles: Article[]): Article[] {
  return articles.filter(
    (a) => a.title && a.title !== '[Removed]' && a.url !== 'https://removed.com'
  );
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

export function useSportNews(sportId: SportId, teamIds: string[] = []) {
  const sportTeams = SPORT_TEAMS[sportId]?.teams ?? [];
  const searchTerms = teamIds
    .map((id) => sportTeams.find((t) => t.id === id)?.searchTerm)
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
