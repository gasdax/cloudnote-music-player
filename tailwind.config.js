/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        background: {
          DEFAULT: '#0f172a',
          surface: '#1e293b',
          'surface-hover': '#334155',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
}
