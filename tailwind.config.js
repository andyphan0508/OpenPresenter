/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      // Semantic tokens (defined in assets/index.css for dark + light).
      colors: {
        app: token('app'),
        panel: token('panel'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        'fg-2': token('fg-2'),
        muted: token('muted'),
        faint: token('faint'),
        live: token('live'),
        select: token('select'),
        danger: token('danger')
      },
      fontSize: { '2xs': ['10px', '14px'] }
    }
  },
  plugins: []
}
