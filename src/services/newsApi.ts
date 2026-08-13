import axios from 'axios';
import type { NewsApiResponse } from '../types/news';

export async function fetchArticlesBySport(
  sportId: string,
  // 1 hero + 15 compact cards, plus headroom for client-side filtering
  pageSize = 20
): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>(`/api/news/sport/${sportId}`, {
    params: { pageSize },
  });
  return data;
}

export async function fetchTopStories(): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>('/api/news/top');
  return data;
}

export async function fetchArticlesByTeam(
  sportId: string,
  teamId: string,
  team: string,
  pageSize = 6
): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>(`/api/news/team/${sportId}`, {
    params: { teamId, team, pageSize },
  });
  return data;
}
