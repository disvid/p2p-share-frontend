/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
        brand: {
          violet: '#7c3aed',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #ec4899 100%)',
        'gradient-soft': 'linear-gradient(135deg, #eef2ff 0%, #fdf4ff 100%)',
        'gradient-mesh':
          'radial-gradient(at 20% 20%, #e0e7ff 0px, transparent 50%), radial-gradient(at 80% 0%, #fce7f3 0px, transparent 50%), radial-gradient(at 80% 80%, #cffafe 0px, transparent 50%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 10px 40px -10px rgba(99,102,241,0.35)',
        'glow-lg': '0 0 0 1px rgba(124,58,237,0.2), 0 20px 60px -15px rgba(124,58,237,0.45)',
        soft: '0 4px 24px -8px rgba(24,24,27,0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.5' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        checkmark: {
          '0%': { strokeDashoffset: '50' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        float: 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 1.5s ease-in-out infinite',
        'spin-slow': 'spinSlow 3s linear infinite',
        checkmark: 'checkmark 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
