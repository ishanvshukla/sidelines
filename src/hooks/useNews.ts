import { useQuery } from '@tanstack/react-query';
import { fetchArticlesBySport, fetchTopStories } from '../services/newsApi';
import type { Article, SportId } from '../types/news';
import { SPORTS } from '../constants/sports';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY as string;

function filterValidArticles(articles: Article[]): Article[] {
  return articles.filter(
    (a) => a.title && a.title !== '[Removed]' && a.url !== 'https://removed.com'
  );
}

export function useTopStories() {
  return useQuery({
    queryKey: ['topStories'],
    queryFn: async () => {
      const data = await fetchTopStories(API_KEY);
      return filterValidArticles(data.articles);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!API_KEY,
  });
}

export function useSportNews(sportId: SportId) {
  const sport = SPORTS.find((s) => s.id === sportId)!;
  return useQuery({
    queryKey: ['sport', sportId],
    queryFn: async () => {
      const data = await fetchArticlesBySport(sport.query, API_KEY);
      return filterValidArticles(data.articles);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!API_KEY,
  });
}
