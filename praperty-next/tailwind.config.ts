import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PrÄperty Copper Forest palette
        amber: {
          brand: '#EB9C35',
          light: '#f0b54e',
          dark: '#C4501B',
        },
        forest: {
          DEFAULT: '#13341E',
          mid: '#4E7145',
          light: '#5a8a4f',
        },
        surface: {
          DEFAULT: '#0a0b08',
          raised: '#0f1210',
          card: 'rgba(78, 113, 69, 0.06)',
        },
        dim: '#6b7a5e',
        muted: '#7a8e6e',
      },
      fontFamily: {
        heading: ['Sora', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-amber': 'linear-gradient(135deg, #EB9C35, #C4501B)',
        'gradient-forest': 'linear-gradient(135deg, #13341E, #4E7145)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6, #2563eb)',
        'gradient-dark': 'linear-gradient(180deg, #080a07 0%, #0f1210 50%, #080a07 100%)',
      },
      animation: {
        'fade-up': 'slideUp 0.5s ease-out both',
        'fade-right': 'slideRight 0.5s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
