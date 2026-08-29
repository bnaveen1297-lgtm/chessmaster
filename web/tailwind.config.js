/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chess.com-inspired: green + neutral charcoal/white.
        ink: '#302E2B', // charcoal (primary text / dark surfaces)
        'ink-soft': '#5C5A55',
        'ink-faint': '#8B8987',
        plaster: '#F7F6F5', // app ground (light neutral)
        'plaster-2': '#ECEBE9',
        line: '#E4E2DF',
        surface: '#FFFFFF',
        // brand green — mapped onto the old "teal" name so existing usage flips
        teal: { DEFAULT: '#81B64C', br: '#95C95C', deep: '#4B7B2E', deep2: '#3C6425' },
        // secondary premium gold (used sparingly)
        gold: { DEFAULT: '#C8972F', br: '#E2B34A', soft: '#F2E3B7' },
        // primary action = green (old "violet" name)
        violet: { DEFAULT: '#81B64C', ink: '#6C9E3E' },
        boardl: '#EBECD0',
        boardd: '#769656',
        success: '#4E9A4E',
        danger: '#CA3431',
        warning: '#D98A24',
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.06), 0 4px 14px -8px rgba(0,0,0,0.12)',
        lift: '0 10px 34px -14px rgba(0,0,0,0.28)',
      },
      borderRadius: { xl2: '16px' },
    },
  },
  plugins: [],
};
