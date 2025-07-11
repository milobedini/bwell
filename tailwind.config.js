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
      sway: {
        dark: '#0c1527',
        background: '#F4F2EB',
        lightGrey: '#e0e9f3',
        bright: '#18cdba'
      }
    },
    extend: {}
  },
  presets: [require('nativewind/preset')],
  plugins: []
};
