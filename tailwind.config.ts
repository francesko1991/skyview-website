import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]', '[data-theme="dusk"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        ink: 'var(--ink)',
        paper: 'var(--paper)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
