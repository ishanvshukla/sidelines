/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chrome — warm blacks & championship gold ("stadium at night")
        'espn-dark':   '#0b0a07',
        'espn-card':   '#13110b',
        'espn-nav':    '#0d0b08',
        'espn-border': '#2a2416',
        'accent-red':  '#c9a227',        // gold primary (name kept for compat)
        'accent-red-hover': '#e6b932',   // gold hover
        gold:          '#c9a227',
        'gold-bright': '#f0c040',
        'gold-dim':    '#7d6415',
        'gold-subtle': '#1e1a08',
        chalk:         '#ede8dc',        // headline off-white
        stone:         '#9a927e',        // muted warm gray for meta text
        // Sport accent colours (unchanged — used for team/section accents only)
        'sport-tennis':          '#4ade80',
        'sport-basketball':      '#f97316',
        'sport-cricket':         '#3b82f6',
        'sport-soccer':          '#22c55e',
        'sport-nfl':             '#8b5cf6',
        'sport-ncaa-basketball': '#fbbf24',
        'sport-formula1':        '#f43f5e',
        'sport-ncaa-football':   '#06b6d4',
        'sport-ufc':             '#ef4444',
        'sport-boxing':          '#a855f7',
      },
      fontFamily: {
        // Display — site title only (Urbanist 900 italic)
        display: ['var(--font-display)', 'sans-serif'],
        // Headings — sport names & section headers (Montserrat 900)
        heading: ['var(--font-heading)', 'sans-serif'],
        // Body — article text, descriptions, navigation, UI elements (Inter)
        body: ['var(--font-body)', 'sans-serif'],
        // Legacy aliases so existing utility classes resolve to the two roles
        brand: ['var(--font-display)', 'sans-serif'],
        oswald: ['var(--font-body)', 'sans-serif'],
        editorial: ['var(--font-body)', 'sans-serif'],
        inter: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
      },
    },
  },
  plugins: [],
};
