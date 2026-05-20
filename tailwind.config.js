/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        kz: {
          950: '#0a0f1e',
          900: '#0d1530',
          800: '#122060',
          700: '#1a2f7a',
          600: '#2241a8',
          DEFAULT: '#2B4EBB',
          400: '#4d6fd4',
          300: '#7a96e8',
          gold: '#F5A623',
          'gold-400': '#f7bc55',
          red: '#E0334C',
        },
      },
    },
  },
  plugins: [],
}