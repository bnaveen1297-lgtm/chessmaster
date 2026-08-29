/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Empower Chess portfolio: black + white/grey, sky-blue accent, gold highlight.
        ink: '#1C1C1E', // near-black (primary text + black CTAs)
        'ink-soft': '#5A5A5F',
        'ink-faint': '#9A9AA0',
        plaster: '#F2F2F4', // app ground (light grey)
        'plaster-2': '#E8E8EC',
        line: '#E1E1E6',
        surface: '#FFFFFF',
        // sky-blue accent (portfolio hero) — mapped onto the old "teal" name
        teal: { DEFAULT: '#2FA6CE', br: '#57C3E6', deep: '#1B6E8C', deep2: '#134F65' },
        // gold highlight (portfolio section numbers / XP / premium)
        gold: { DEFAULT: '#C9A24B', br: '#DDB962', soft: '#EFDCA8' },
        // primary action = black (portfolio "Join / Sign In" buttons)
        violet: { DEFAULT: '#1C1C1E', ink: '#000000' },
        boardl: '#EED9B6',
        boardd: '#B58863',
        success: '#2E9E6B',
        danger: '#D3524B',
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
