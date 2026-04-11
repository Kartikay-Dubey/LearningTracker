/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          primary: 'rgb(var(--color-premium-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-premium-secondary) / <alpha-value>)',
          card: 'rgb(var(--color-premium-card) / <alpha-value>)',
          border: 'rgb(var(--color-premium-border) / <alpha-value>)',
          accent: 'rgb(var(--color-premium-accent) / <alpha-value>)',
          success: 'rgb(var(--color-premium-accent) / <alpha-value>)',
          highlight: 'rgb(var(--color-premium-highlight) / <alpha-value>)',
          danger: 'rgb(var(--color-premium-danger) / <alpha-value>)'
        }
      }
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
