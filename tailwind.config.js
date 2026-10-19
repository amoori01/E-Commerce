/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amg: {
          navy: {
            DEFAULT: '#1E2B58',
            50: '#F0F4FA',
            100: '#E2E8F4',
            200: '#C5D2E9',
            300: '#9DB3DB',
            400: '#6D8EC8',
            500: '#476CB2',
            600: '#2E5094',
            700: '#263676',
            800: '#1E2B58',
            900: '#151E3D',
            950: '#0C1123',
          },
          red: {
            DEFAULT: '#971E21',
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#971E21',
            900: '#7F1D1D',
            950: '#450A0A',
          },
          slate: {
            base: '#231F20',
            border: '#E2E8F0',
            surface: '#F8FAFC',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '8px',
        '2xl': '8px',
        'full': '9999px',
      },
      boxShadow: {
        'crisp': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'panel': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'modal': '0 10px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
}
