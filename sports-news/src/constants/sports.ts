import type { Sport } from '../types/news';

export const SPORTS: Sport[] = [
  {
    id: 'tennis',
    label: 'Tennis',
    query: 'tennis',
    color: '#4ade80',
    bgClass: 'bg-sport-tennis',
    textClass: 'text-sport-tennis',
    borderClass: 'border-sport-tennis',
  },
  {
    id: 'basketball',
    label: 'Basketball',
    query: 'basketball NBA',
    color: '#f97316',
    bgClass: 'bg-sport-basketball',
    textClass: 'text-sport-basketball',
    borderClass: 'border-sport-basketball',
  },
  {
    id: 'cricket',
    label: 'Cricket',
    query: 'cricket IPL',
    color: '#3b82f6',
    bgClass: 'bg-sport-cricket',
    textClass: 'text-sport-cricket',
    borderClass: 'border-sport-cricket',
  },
];

export const SPORT_MAP = Object.fromEntries(SPORTS.map((s) => [s.id, s])) as Record<string, Sport>;
