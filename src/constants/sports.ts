import type { Sport } from '../types/news';

export const SPORTS: Sport[] = [
  { id: 'tennis',          label: 'Tennis',            query: 'tennis',          color: '#4ade80', bgClass: 'bg-sport-tennis',          textClass: 'text-sport-tennis',          borderClass: 'border-sport-tennis' },
  { id: 'basketball',      label: 'NBA Basketball',    query: 'basketball NBA',  color: '#f97316', bgClass: 'bg-sport-basketball',      textClass: 'text-sport-basketball',      borderClass: 'border-sport-basketball' },
  { id: 'soccer',          label: 'Soccer',            query: 'soccer',          color: '#22c55e', bgClass: 'bg-sport-soccer',          textClass: 'text-sport-soccer',          borderClass: 'border-sport-soccer' },
  { id: 'nfl',             label: 'NFL Football',      query: 'nfl',             color: '#8b5cf6', bgClass: 'bg-sport-nfl',             textClass: 'text-sport-nfl',             borderClass: 'border-sport-nfl' },
  { id: 'formula1',        label: 'Formula 1',         query: 'formula1',        color: '#f43f5e', bgClass: 'bg-sport-formula1',        textClass: 'text-sport-formula1',        borderClass: 'border-sport-formula1' },
  { id: 'ncaa-football',   label: 'College Football',  query: 'ncaa-football',   color: '#06b6d4', bgClass: 'bg-sport-ncaa-football',   textClass: 'text-sport-ncaa-football',   borderClass: 'border-sport-ncaa-football' },
  { id: 'ufc',             label: 'UFC / MMA',         query: 'ufc',             color: '#ef4444', bgClass: 'bg-sport-ufc',             textClass: 'text-sport-ufc',             borderClass: 'border-sport-ufc' },
];

export const SPORT_MAP = Object.fromEntries(SPORTS.map((s) => [s.id, s])) as Record<string, Sport>;
