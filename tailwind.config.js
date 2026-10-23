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
        background: '#09090b',
        canvas: '#000000',
        surface: '#121215',
        'surface-raised': '#1a1a20',
        'surface-elevated': '#22222a',
        'surface-pill': '#282832',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-strong': 'rgba(255, 255, 255, 0.16)',
        'border-subtle': 'rgba(255, 255, 255, 0.04)',
        apple: {
          blue: '#0a84ff',
          green: '#30d158',
          red: '#ff453a',
          amber: '#ff9f0a',
          purple: '#bf5af2',
          teal: '#64d2ff',
          gray: '#8e8e93',
          card: '#141418',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          '"Cascadia Code"',
          'monospace',
        ],
      },
      boxShadow: {
        bento: '0 8px 32px 0 rgba(0, 0, 0, 0.36), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'pill-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px -5px rgba(10, 132, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
