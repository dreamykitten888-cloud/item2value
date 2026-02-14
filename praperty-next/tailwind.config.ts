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
        // PrÄperty brand colors (matched from original prototype)
        amber: {
          brand: '#d4a853',
          light: '#e8c97a',
          dark: '#b8860b',
        },
        surface: {
          DEFAULT: '#06060b',
          raised: '#0d0d14',
          card: 'rgba(255, 255, 255, 0.04)',
        },
        dim: '#475569',
        muted: '#64748b',
      },
      fontFamily: {
        heading: ['Sora', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-amber': 'linear-gradient(135deg, #d4a853, #b8860b)',
        'gradient-purple': 'linear-gradient(135deg, #a855f7, #7c3aed)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6, #2563eb)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #0d0d14 50%, #0a0a0f 100%)',
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
