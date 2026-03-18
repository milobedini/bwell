/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      primary: '#000000',
      white: '#ffffff',
      black: '#000000',
      background: '#F4F2EB',
      info: '#FFD15D',
      success: '#76AB70',
      accent: '#FFB0C0',
      error: '#FF6D5E',
      warning: '#FFB300',
      sway: {
        dark: '#0c1527',
        background: '#F4F2EB',
        lightGrey: '#e0e9f3',
        darkGrey: '#a6adbb',
        bright: '#18cdba',
        buttonBackground: 'rgba(43,59,91,0.4)',
        buttonBackgroundSolid: 'rgb(43,59,91)'
      },
      chip: {
        infoBlue: '#93C5FD',
        infoBlueBorder: '#1E3A8A',
        teal: '#2DD4BF',
        tealBorder: '#164E4E',
        amber: '#FBBF24',
        amberBorder: '#7C5E12',
        red: '#F87171',
        redBorder: '#7F1D1D',
        green: '#34D399',
        greenBorder: '#065F46',
        neutral: '#E6E8EF',
        neutralBorder: '#3B3F51',
        darkCard: '#262E42',
        darkCardAlt: '#334368',
        darkCardDeep: '#0B1A2A',
        dotInactive: '#3A496B'
      },
      diary: {
        moodWarm: '#f4a261',
        moodCool: '#5b8def',
        closeness: '#e76f9a',
        enjoyment: '#a78bfa',
        promptBg: '#1a3a4a'
      }
    },
    extend: {}
  },
  presets: [require('nativewind/preset')],
  plugins: []
};
