import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        surface: {
          DEFAULT: 'var(--bg-card)',
          secondary: 'var(--bg-secondary)',
          hover: 'var(--bg-hover)',
        },
        border: 'var(--border-color)',
        muted: {
          DEFAULT: 'var(--bg-secondary)',
          foreground: 'var(--text-secondary)',
        },
        primary: {
          DEFAULT: 'var(--btn-primary-bg)',
          foreground: 'var(--btn-primary-text)',
        },
      },
      borderRadius: {
        card: '24px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
        'card-dark':
          '0 1px 2px 0 rgba(0, 0, 0, 0.35), 0 8px 24px -8px rgba(0, 0, 0, 0.45)',
        elevated: '0 12px 32px -8px rgba(0, 0, 0, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
