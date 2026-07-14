import axios from 'axios';
import type { NewsApiResponse } from '../types/news';

export async function fetchArticlesBySport(
  sportId: string,
  searchTerms: string[] = [],
  // 1 hero + 8 compact cards, plus headroom for client-side filtering
  pageSize = 12
): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>(`/api/news/sport/${sportId}`, {
    params: {
      pageSize,
      ...(searchTerms.length > 0 ? { teams: searchTerms.join(',') } : {}),
    },
  });
  return data;
}

export async function fetchTopStories(): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>('/api/news/top');
  return data;
}
