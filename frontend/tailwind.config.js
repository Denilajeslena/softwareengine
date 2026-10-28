/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#183D32',
          dark: '#102B24',
          light: '#235345',
          soft: '#2D6554',
          subtle: '#E8EFEA',
        },
        ivory: {
          DEFAULT: '#F8F5EC',
          cream: '#EFE8D9',
          border: '#E2D9C5',
          darker: '#DDD2BA',
        },
        gold: {
          DEFAULT: '#C3A66B',
          light: '#D8C28E',
          dark: '#A6884F',
          muted: '#E6DCBF',
        },
        charcoal: {
          DEFAULT: '#252B28',
          light: '#3C4541',
          muted: '#5A6661',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E5ECE8',
          200: '#CBD9D1',
          300: '#A4BCB1',
          600: '#4E5D57',
          700: '#3D4944',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'scholarly': '0 4px 20px -2px rgba(24, 61, 50, 0.08), 0 2px 6px -1px rgba(24, 61, 50, 0.04)',
        'scholarly-lg': '0 10px 30px -4px rgba(24, 61, 50, 0.12), 0 4px 12px -2px rgba(24, 61, 50, 0.06)',
        'scholarly-elevated': '0 20px 40px -6px rgba(16, 43, 36, 0.16)',
      },
      borderRadius: {
        'scholarly': '10px',
      },
    },
  },
  plugins: [],
}

