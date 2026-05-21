export interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

export type SportId = 'tennis' | 'basketball' | 'cricket';

export interface Sport {
  id: SportId;
  label: string;
  query: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}
