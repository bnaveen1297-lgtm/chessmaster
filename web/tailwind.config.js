/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17313A',
        'ink-soft': '#47616A',
        'ink-faint': '#8598A0',
        plaster: '#F5F0E6',
        'plaster-2': '#EFE8D9',
        line: '#DDD3C0',
        surface: '#FFFFFF',
        teal: { DEFAULT: '#0E9AA7', br: '#1FB6C4', deep: '#0A2E37', deep2: '#0C3B46' },
        gold: { DEFAULT: '#B8912F', br: '#C9A24B', soft: '#E7D3A1' },
        violet: { DEFAULT: '#5B4BE0', ink: '#4536c9' },
        boardl: '#EAD9B0',
        boardd: '#9B7A4A',
        success: '#2E9E6B',
        danger: '#C8524B',
        warning: '#D98A24',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 10px 26px -16px rgba(10,46,55,0.4)',
        lift: '0 24px 60px -28px rgba(10,46,55,0.45)',
      },
      borderRadius: { xl2: '18px' },
    },
  },
  plugins: [],
};
