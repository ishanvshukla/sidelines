import type { Sport } from '../../types/news';

interface Props {
  sport: Sport;
  size?: 'sm' | 'md';
}

export default function SportBadge({ sport, size = 'sm' }: Props) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-block font-oswald font-semibold uppercase tracking-wider rounded ${padding}`}
      style={{ backgroundColor: sport.color, color: '#0d0d14' }}
    >
      {sport.label}
    </span>
  );
}
