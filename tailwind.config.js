/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'espn-dark': '#0d0d14',
        'espn-card': '#16213e',
        'espn-nav': '#1a1a2e',
        'espn-border': '#2a2a4a',
        'accent-red': '#cc0000',
        'accent-red-hover': '#ee0000',
        'sport-tennis': '#4ade80',
        'sport-basketball': '#f97316',
        'sport-cricket': '#3b82f6',
        'sport-soccer': '#22c55e',
        'sport-nfl': '#8b5cf6',
        'sport-ncaa-basketball': '#fbbf24',
        'sport-formula1': '#f43f5e',
        'sport-ncaa-football': '#06b6d4',
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
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
