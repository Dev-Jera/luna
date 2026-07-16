/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Georgia', 'serif']
      },
      colors: {
        terracotta: {
          50: '#ffeedd',
          100: '#ffddcc',
          200: '#ffccbb',
          300: '#fca5a5',
          500: '#f27059',
          600: '#e05e47',
          700: '#b93c27',
        },
        cocoa: {
          50: '#f5ebe0',
          100: '#e6ccb2',
          300: '#b7b7a4',
          500: '#6b705c',
          700: '#3f37c9',
          900: '#1e1410',
        },
        cream: '#ffffff',
        warmbg: '#9c6644',
        // Compatibility mappings to prevent breakage in legacy screens
        lime: {
          DEFAULT: '#8ea869',
          50: '#f4f8ed',
          100: '#e8eedb',
          200: '#d1dfb7',
          300: '#b9cf93',
          500: '#8ea869',
          600: '#748e50',
          700: '#5a733c',
        },
        ink: {
          DEFAULT: '#1e1410',
          50: '#f5ebe0',
          100: '#e6ccb2',
          300: '#b7b7a4',
          500: '#6b705c',
          700: '#3f37c9',
          900: '#1e1410',
        }
      },
      boxShadow: {
        glow: '0 0 60px rgba(242,112,89,.15)',
        premium: '0 10px 35px -5px rgba(30,20,16,.08), 0 2px 4px rgba(30,20,16,.03)',
        soft: '0 4px 20px -2px rgba(30,20,16,.04)'
      }
    }
  },
  plugins: []
}

