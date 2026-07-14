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

export type SportId =
  | 'tennis'
  | 'basketball'
  | 'cricket'
  | 'soccer'
  | 'nfl'
  | 'ncaa-basketball'
  | 'formula1'
  | 'ncaa-football'
  | 'ufc'
  | 'boxing';

export interface Sport {
  id: SportId;
  label: string;
  query: string;
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

export interface TeamGroup {
  label: string;   // e.g. "Teams", "Players", "Fighters", "Clubs"
  items: Team[];
}

export interface SportTeamConfig {
  groups: TeamGroup[];
}

export interface NextGame {
  follows: string[];
  followedSide: 'home' | 'away';
  name: string | null;
  home: string | null;
  away: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
  homeScore: string | null;
  awayScore: string | null;
  league: string | null;
  venue: string | null;
  timestamp: string | null;
}

export interface Prefs {
  sports: SportId[];
  teams: Partial<Record<SportId, string[]>>; // sportId → selected item IDs
}
