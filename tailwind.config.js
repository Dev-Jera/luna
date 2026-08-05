/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Playfair Display', 'Georgia', 'serif']
      },
      colors: {
        terracotta: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        cocoa: {
          50: '#fafafa',
          100: '#f5f5f5',
          300: '#a3a3a3',
          500: '#737373',
          700: '#404040',
          900: '#000000',
        },
        cream: '#ffffff',
        warmbg: '#c8102e',
        brand: {
          DEFAULT: '#c8102e',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#c8102e',
        },
        // Compatibility mappings to prevent breakage in legacy screens
        lime: {
          DEFAULT: '#ffffff',
          50: '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          500: '#ffffff',
          600: '#e5e5e5',
          700: '#d4d4d4',
        },
        ink: {
          DEFAULT: '#000000',
          50: '#fafafa',
          100: '#f5f5f5',
          300: '#a3a3a3',
          500: '#737373',
          700: '#404040',
          900: '#000000',
        }
      },
      boxShadow: {
        glow: '0 0 60px rgba(220,38,38,.2)',
        premium: '0 10px 35px -5px rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.2)',
        soft: '0 4px 20px -2px rgba(0,0,0,.25)'
      }
    }
  },
  plugins: []
}
