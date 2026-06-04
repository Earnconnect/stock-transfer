/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep institutional navy — primary brand
        brand: {
          50: "#eef2ff",
          100: "#dde6ff",
          200: "#c2d2ff",
          300: "#9bb4ff",
          400: "#728bfb",
          500: "#5066f3",
          600: "#3a45e7",
          700: "#2f34cc",
          800: "#282ea4",
          900: "#1f2473",
          950: "#141642",
        },
        // Accent gold for "official seal" accents
        gold: {
          400: "#e8c15a",
          500: "#d4a72c",
          600: "#b4861a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)",
        lift: "0 10px 30px -12px rgba(15,23,42,0.18)",
      },
    },
  },
  plugins: [],
};
