export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0d1b3e',
          light:   '#142040',   // sidebar bg
          mid:     '#1e3163',
        },
        accent: {
          DEFAULT: '#1e5fa8',
          lt:      '#2d72c4',
        },
        gold: {
          DEFAULT: '#b8902a',
          lt:      '#d4aa45',
        },
        // override Tailwind gray with our palette
        gray: {
          50:  '#f5f6f9',
          100: '#eceef3',
          200: '#d8dce6',
          300: '#c0c8d8',
          400: '#8d97aa',
          500: '#6b7a90',
          600: '#4f5d73',
          700: '#3a4a5e',
          800: '#1e2939',
          900: '#131e2e',
        },
        success: {
          DEFAULT: '#1a6e3c',
          bg:      '#e6f4ec',
        },
        danger: {
          DEFAULT: '#8b1a1a',
          bg:      '#fceaea',
        },
        warn: {
          DEFAULT: '#7a4f00',
          bg:      '#fff3d6',
        },
        pending: {
          DEFAULT: '#1e4d8c',
          bg:      '#eef3fb',
        },
        atrisk: {
          DEFAULT: '#8b3a1a',
          bg:      '#fdf0ef',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        'xs':  ['0.75rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}