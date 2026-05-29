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

export type SportId = 'tennis' | 'basketball' | 'cricket' | 'soccer' | 'nfl' | 'ncaa-basketball' | 'formula1' | 'ncaa-football';

export interface Sport {
  id: SportId;
  label: string;
  query: string;
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface Team {
  id: string;
  name: string;
  searchTerm: string;
}

export interface SportTeamConfig {
  entityLabel: string;
  teams: Team[];
}

export interface Prefs {
  sports: SportId[];
  teams: Partial<Record<SportId, string[]>>; // sportId → team IDs
}
