/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        pitch: {
          900: '#0a1a0f',
          800: '#0f2516',
          700: '#163520',
          600: '#1d4a2c',
        },
        grass: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
