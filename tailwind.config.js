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
        midnight: {
          DEFAULT: '#0B0B0C',
          50: '#2A2A2E',
          100: '#222225',
          200: '#1A1A1D',
          300: '#141416',
          400: '#0F0F10',
          500: '#0B0B0C',
        },
        lime: {
          DEFAULT: '#C6F432',
          light: '#D7F860',
          dark: '#AEE015',
          soft: '#EAFBC0',
        },
        amg: {
          navy: {
            DEFAULT: '#0B0B0C',
            50: '#F5F5F7',
            100: '#EAEAEF',
            200: '#D5D5DD',
            300: '#9E9EB2',
            400: '#5A5A6E',
            500: '#32323D',
            600: '#202028',
            700: '#16161C',
            800: '#0F0F13',
            900: '#0B0B0C',
            950: '#060607',
          },
          red: {
            DEFAULT: '#C6F432',
            50: '#F8FDE6',
            100: '#EFFCC8',
            200: '#E4FA9B',
            300: '#D7F860',
            400: '#C6F432',
            500: '#AEE015',
            600: '#8FB80D',
            700: '#719208',
            800: '#526A05',
            900: '#344302',
            950: '#1A2200',
          },
          slate: {
            base: '#0B0B0C',
            border: '#E4E4E7',
            surface: '#FAFAFA',
          }
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
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
