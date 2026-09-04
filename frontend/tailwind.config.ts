import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FormPilot design system — slate-indigo-violet palette
        // Accessible, professional, eye-soothing
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",  // primary brand
          600: "#4f46e5",  // hover state
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",  // secondary accent
          600: "#7c3aed",
        },
        surface: "#ffffff",
        muted: "#f8fafc",    // slate-50
        border: "#e2e8f0",   // slate-200
        "text-base": "#1e293b",   // slate-800
        "text-muted": "#64748b",  // slate-500
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        sidebar: "4px 0 24px -4px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
