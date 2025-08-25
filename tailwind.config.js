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
      }
    },
    extend: {}
  },
  presets: [require('nativewind/preset')],
  plugins: []
};
