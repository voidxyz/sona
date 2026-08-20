/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — mirrored from the CSS variables in index.css
        ink: 'var(--ink)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        paper: 'var(--paper)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        ghost: 'var(--ghost)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
      },
      fontFamily: {
        // Geist — clean Swiss grotesque, used for titles and the wordmark
        display: ['Geist', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        // Geist Mono — every label, counter, timecode and control legend
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        micro: ['0.5625rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        meta: ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.06em' }],
      },
      letterSpacing: {
        label: '0.16em',
        wide: '0.06em',
      },
      borderRadius: {
        // Swiss grid: everything is square. `sm` is the only concession.
        none: '0px',
        sm: '2px',
      },
      transitionTimingFunction: {
        swiss: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
