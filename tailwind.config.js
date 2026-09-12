/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F1F0E6',
          deep: '#E8E6DA',
          tile: '#EDEBDE',
          line: '#D8D6C6',
        },
        ink: {
          DEFAULT: '#1E2A1F',
          soft: '#565F58',
          mute: '#747D74',
        },
        indigo: {
          DEFAULT: '#2F3E5C',
          soft: '#4A5C80',
          tint: '#E6E9F0',
        },
        turmeric: {
          DEFAULT: '#C1861A',
          deep: '#9C6E10',
          tint: '#F4E7C9',
        },
        leaf: {
          DEFAULT: '#3F6B45',
          soft: '#5B8261',
          tint: '#E4EBE1',
        },
        clay: {
          DEFAULT: '#A85736',
          deep: '#8C462B',
          tint: '#F0E3DA',
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', '-apple-system', 'sans-serif'],
        slab: ['Zilla Slab', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};