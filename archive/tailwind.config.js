/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Batman-inspired dark theme
        batman: {
          black: '#0a0a0a',
          dark: '#121212',
          gray: '#1a1a1a',
          light: '#2a2a2a',
          subtle: '#333333',
        },
        // Gold accents (Bat signal)
        gold: {
          DEFAULT: '#d4a514',
          bright: '#ffd700',
          dim: '#b8860b',
        },
        // Teal for AI/tech
        teal: {
          DEFAULT: '#00d4ff',
          bright: '#00ffff',
          dim: '#008b8b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}