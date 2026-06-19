/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Semantic color tokens. Each maps to a CSS custom property holding an
      // "R G B" triplet, so Tailwind's <alpha-value> opacity modifiers work
      // (e.g. bg-surface/70). Themes swap the variables at runtime in index.css.
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryFg: 'rgb(var(--color-primary-fg) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Iowan Old Style"', 'Georgia', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [],
};
