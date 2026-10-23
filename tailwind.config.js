/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'phosphor-green': '#3ecf8e',
        'mint-pulse': '#00c573',
        'forest-depth': '#1f4b37',
        'midnight-emerald': '#006239',
        snow: '#fafafa',
        'silver-mist': '#b4b4b4',
        smoke: '#898989',
        graphite: '#4d4d4d',
        slate: '#393939',
        charcoal: '#2e2e2e',
        ash: '#242424',
        obsidian: '#121212',
      },
      borderRadius: {
        cards: '16px',
        inputs: '8px',
        buttons: '9999px',
        tags: '9999px',
      },
      fontFamily: {
        sans: [
          'Circular',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
        mono: [
          '"Source Code Pro"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      letterSpacing: {
        tightest: '-0.007em',
        code: '0.100em',
      },
    },
  },
  plugins: [],
};
