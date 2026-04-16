/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
      },
      colors: {
        nexus: {
          black: '#0A0A0A',
          charcoal: '#111111',
          dark: '#1A1A1A',
          border: '#2A2A2A',
          mid: '#404040',
          muted: '#8A8A8A',
          light: '#E5E5E5',
          white: '#FFFFFF',
          green: '#00FF66',
          red: '#FF3333',
          orange: '#FF9900',
          coral: '#FF6B35',
          purple: '#9D4EDD',
        },
      },
      backgroundImage: {
        'nexus-gradient': 'linear-gradient(135deg, #9D4EDD 0%, #FF6B35 100%)',
        'nexus-gradient-subtle': 'linear-gradient(135deg, #9D4EDD22 0%, #FF6B3522 100%)',
      },
    },
  },
  plugins: [],
};
