/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // chesshub360 logo identity: black + azure blue on clean cool-grey/white.
        ink: '#111418', // near-black (primary text + black surfaces/CTAs)
        'ink-soft': '#565B63',
        'ink-faint': '#9096A0',
        plaster: '#F4F6F8', // app ground (cool light grey)
        'plaster-2': '#EAEDF1',
        line: '#E2E6EB',
        surface: '#FFFFFF',
        // azure blue accent (the logo ring) — mapped onto the old "teal" name
        teal: { DEFAULT: '#1E88E5', br: '#42A5F5', deep: '#1565C0', deep2: '#0D3E86' },
        // gold reserved for XP / achievements only
        gold: { DEFAULT: '#C9A24B', br: '#DDB962', soft: '#EFDCA8' },
        // primary action = black
        violet: { DEFAULT: '#111418', ink: '#000000' },
        boardl: '#EED9B6',
        boardd: '#B58863',
        success: '#2E9E6B',
        danger: '#E23B3B',
        warning: '#E08A24',
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
