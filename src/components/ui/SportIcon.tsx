import type { JSX } from 'react';
import type { SportId } from '../../types/news';

/*
 * All icons use viewBox="0 0 24 24" and inherit colour from the parent via
 * `currentColor`. Ball, cricket and flag shapes are adapted from Tabler Icons
 * (https://tabler.io/icons, MIT license); the octagon and boxing glove are
 * custom-drawn in the same stroke style.
 */
const PATHS: Record<SportId, JSX.Element> = {

  // ── Tennis ─────────────────────────────────────────────────────────────
  tennis: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 5.3a9 9 0 0 1 0 13.4" />
      <path d="M18 5.3a9 9 0 0 0 0 13.4" />
    </>
  ),

  // ── Basketball ─────────────────────────────────────────────────────────
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.65 5.65l12.7 12.7" />
      <path d="M5.65 18.35l12.7 -12.7" />
      <path d="M12 3a9 9 0 0 0 9 9" />
      <path d="M3 12a9 9 0 0 1 9 9" />
    </>
  ),

  // ── Cricket ────────────────────────────────────────────────────────────
  cricket: (
    <>
      <path d="M11.105 18.79l-1 .992a4.159 4.159 0 0 1 -6.038 -5.715l.157 -.166l8.282 -8.401l1.5 1.5l3.45 -3.391a2.08 2.08 0 0 1 3.057 2.815l-.116 .126l-3.391 3.45l1.5 1.5l-3.668 3.617" />
      <path d="M10.5 7.5l6 6" />
      <circle cx="14" cy="18" r="3" />
    </>
  ),

  // ── Soccer ─────────────────────────────────────────────────────────────
  soccer: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55z" />
      <path d="M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45" />
    </>
  ),

  // ── NFL / American Football ─────────────────────────────────────────────
  nfl: (
    <>
      <path d="M16 3c-7.18 0 -13 5.82 -13 13a5 5 0 0 0 5 5c7.18 0 13 -5.82 13 -13a5 5 0 0 0 -5 -5" />
      <path d="M16 3a5 5 0 0 0 5 5" />
      <path d="M8 21a5 5 0 0 0 -5 -5" />
      <path d="M15 9l-6 6" />
      <path d="M10 12l2 2" />
      <path d="M12 10l2 2" />
    </>
  ),

  // ── College Basketball ──────────────────────────────────────────────────
  'ncaa-basketball': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.65 5.65l12.7 12.7" />
      <path d="M5.65 18.35l12.7 -12.7" />
      <path d="M12 3a9 9 0 0 0 9 9" />
      <path d="M3 12a9 9 0 0 1 9 9" />
    </>
  ),

  // ── Formula 1 ──────────────────────────────────────────────────────────
  // Chequered flag: pole + rectangular flag, alternating filled squares
  formula1: (
    <>
      <path d="M5 14h14v-9h-14v16" />
      <path
        d="M5 5h3.5v3h-3.5z M12 5h3.5v3h-3.5z M8.5 8h3.5v3h-3.5z M15.5 8h3.5v3h-3.5z M5 11h3.5v3h-3.5z M12 11h3.5v3h-3.5z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),

  // ── College Football ────────────────────────────────────────────────────
  'ncaa-football': (
    <>
      <path d="M16 3c-7.18 0 -13 5.82 -13 13a5 5 0 0 0 5 5c7.18 0 13 -5.82 13 -13a5 5 0 0 0 -5 -5" />
      <path d="M16 3a5 5 0 0 0 5 5" />
      <path d="M8 21a5 5 0 0 0 -5 -5" />
      <path d="M15 9l-6 6" />
      <path d="M10 12l2 2" />
      <path d="M12 10l2 2" />
    </>
  ),

  // ── UFC / MMA ──────────────────────────────────────────────────────────
  // The octagon cage: outer + inner walls
  ufc: (
    <>
      <path d="M8.3 3h7.4l5.3 5.3v7.4l-5.3 5.3h-7.4l-5.3 -5.3v-7.4z" />
      <path d="M9.5 5.9h5l3.6 3.6v5l-3.6 3.6h-5l-3.6 -3.6v-5z" />
    </>
  ),

  // ── Boxing ─────────────────────────────────────────────────────────────
  // Boxing glove: rounded mitt + thumb + knuckle seam + wrist cuff
  boxing: (
    <>
      <path d="M7 13.5v-4c0 -3 2.5 -5.5 5.5 -5.5s5.5 2.5 5.5 5.5v3.5c0 2.8 -2.2 5 -5 5h-1.5c-2.5 0 -4.5 -2 -4.5 -4.5z" />
      <path d="M7 10.2c-2.1 -0.2 -3.6 1.2 -3.6 2.9c0 1.7 1.5 3 3.5 2.5" />
      <path d="M9.5 7.5c1.8 -0.9 4.2 -0.9 6 0" />
      <path d="M10 18v2.5h5v-2.5" />
    </>
  ),

};

interface Props {
  sportId: SportId;
  size?: number;
  className?: string;
}

export default function SportIcon({ sportId, size = 24, className = '' }: Props) {
  const paths = PATHS[sportId];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
