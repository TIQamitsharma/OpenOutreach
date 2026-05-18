/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef7ff',
          100: '#d9ecff',
          200: '#bbddff',
          300: '#8cc7ff',
          400: '#57aaff',
          500: '#2e8bff',
          600: '#1a6ef5',
          700: '#1457e0',
          800: '#1747b5',
          900: '#193f8f',
          950: '#142757',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
