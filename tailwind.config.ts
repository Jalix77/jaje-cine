/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          gold: '#D4AF37',
          coral: '#FF6B6B',
          'dark-gray': '#1A1A1A',
          'light-gray': '#B8B8B8'
        },
        fontFamily: {
          'serif': ['Playfair Display', 'serif'],
          'sans': ['Inter', 'sans-serif']
        }
      },
    },
    plugins: [],
  }