import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rp: {
          bg: '#FFFFFF',
          surface: '#F8FBF9',
          elevated: '#EEF7F2',
          border: '#D4E8DC',
          primary: '#1aaa5e',
          'primary-hover': '#157a46',
          secondary: '#2cc774',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          'text-primary': '#191D25',
          'text-secondary': '#638070',
          'text-muted': '#8aaa98',
          sidebar: '#F0F7F3',
        }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
}

export default config
