/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(0.14 0.01 240)',
        'bg-lift': 'oklch(0.17 0.01 240)',
        'bg-card': 'oklch(0.19 0.01 240)',
        'bg-hover': 'oklch(0.22 0.01 240)',
        border: 'oklch(0.28 0.01 240)',
        text: 'oklch(0.94 0.005 85)',
        'text-dim': 'oklch(0.70 0.01 240)',
        'text-faint': 'oklch(0.50 0.01 240)',
        accent: 'oklch(0.78 0.13 145)',
        warn: 'oklch(0.78 0.13 75)',
        danger: 'oklch(0.72 0.15 25)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
