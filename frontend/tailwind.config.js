/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OKLCH color system from reference implementation
        bg:        'oklch(0.14 0.01 240)',
        bgLift:    'oklch(0.17 0.01 240)',
        bgCard:    'oklch(0.19 0.01 240)',
        bgInset:   'oklch(0.12 0.01 240)',
        border:    'oklch(0.28 0.01 240)',
        borderLt:  'oklch(0.24 0.01 240)',
        text:      'oklch(0.94 0.005 85)',
        textDim:   'oklch(0.64 0.01 240)',
        textMuted: 'oklch(0.46 0.01 240)',
        accent:    'oklch(0.78 0.13 145)', // mastery green
        warn:      'oklch(0.78 0.13 75)',  // due amber
        danger:    'oklch(0.72 0.15 25)',  // lapse red
        info:      'oklch(0.78 0.13 230)', // info blue
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
    },
  },
  plugins: [],
}