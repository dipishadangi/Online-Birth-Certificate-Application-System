/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        navy: {
          800: '#0f1630',
          900: '#090d1f',
          950: '#060810',
        },
        slate: {
          25: '#f8fafc',
        }
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        'gradient-page': 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 50%, #f5f3ff 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,244,255,0.8) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        'gradient-warning': 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        'gradient-danger': 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(99,102,241,0.08), 0 8px 24px -4px rgba(99,102,241,0.12)',
        'card-hover': '0 4px 6px -1px rgba(99,102,241,0.12), 0 16px 40px -8px rgba(99,102,241,0.18)',
        'glow': '0 0 0 3px rgba(99,102,241,0.25)',
        'glow-green': '0 0 0 3px rgba(16,185,129,0.25)',
        'glow-red': '0 0 0 3px rgba(239,68,68,0.25)',
        'nav': '0 1px 0 0 rgba(99,102,241,0.12), 0 4px 32px -4px rgba(9,13,31,0.4)',
        'input': '0 1px 2px 0 rgba(0,0,0,0.06)',
        'input-focus': '0 0 0 3px rgba(99,102,241,0.2), 0 1px 2px 0 rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
