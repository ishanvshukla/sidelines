import axios from 'axios';
import type { NewsApiResponse } from '../types/news';

const BASE_URL = 'https://newsapi.org/v2/everything';

export async function fetchArticlesBySport(
  query: string,
  apiKey: string,
  pageSize = 8
): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>(BASE_URL, {
    params: {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
      apiKey,
    },
  });
  return data;
}

export async function fetchTopStories(apiKey: string): Promise<NewsApiResponse> {
  const { data } = await axios.get<NewsApiResponse>(BASE_URL, {
    params: {
      q: 'tennis OR basketball OR cricket',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 6,
      apiKey,
    },
  });
  return data;
}
