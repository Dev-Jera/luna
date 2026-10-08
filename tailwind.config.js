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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#168eea',
          700: '#0875c6',
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
        warmbg: '#0b1728',
        brand: {
          DEFAULT: '#168eea',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#168eea',
          700: '#0875c6',
          800: '#075fa3',
          900: '#0b3c74',
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
        premium: '0 10px 35px -5px rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.2)',
        soft: '0 4px 20px -2px rgba(0,0,0,.25)'
      }
    }
  },
  plugins: []
}
