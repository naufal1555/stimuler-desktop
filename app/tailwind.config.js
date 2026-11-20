/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stimuler: {
          bg: '#F7F6FF',
          card: '#FFFFFF',
          primary: '#5A45FF',
          primaryHover: '#4B36F0',
          accent: '#6C5CE7',
          gold: '#F9A834',
          goldHover: '#E89723',
          green: '#3BBE8F',
          red: '#F35252',
          textDark: '#1E1B4B',
          textMuted: '#6B7280',
          border: '#E8E5F8'
        }
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        display: ['Satoshi', 'sans-serif'],
        metrics: ['InterDisplay', 'sans-serif']
      }
    },
  },
  plugins: [],
}
