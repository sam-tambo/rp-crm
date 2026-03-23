import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rp: {
          bg: '#0A0A0F',
          surface: '#111118',
          elevated: '#1A1A24',
          border: '#2A2A38',
          primary: '#6366F1',
          'primary-hover': '#4F46E5',
          secondary: '#8B5CF6',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          'text-primary': '#F4F4F8',
          'text-secondary': '#9090A8',
          'text-muted': '#5A5A70',
          sidebar: '#0D0D14',
        }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
}

export default config
