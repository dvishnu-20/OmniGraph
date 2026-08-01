/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111827",
        "surface-border": "#1f293d",
        primary: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          violet: "#8b5cf6"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
        "wave-expand": "waveExpand 1.5s infinite cubic-bezier(0, 0.2, 0.8, 1)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.8, boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)" },
          "50%": { opacity: 1, boxShadow: "0 0 35px rgba(99, 102, 241, 0.8)" },
        },
        waveExpand: {
          "0%": { transform: "scale(0.8)", opacity: 0.9 },
          "100%": { transform: "scale(1.8)", opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
