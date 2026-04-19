import type { Config } from "tailwindcss";

/**
 * Tailwind v4 primarily configures via CSS `@theme` in styles/globals.css.
 * This file exists to document the semantic token mapping and to support
 * any tooling that still inspects a tailwind.config.ts.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#1F2937",
        sage: "#1E3A8A",
        gold: "#3B82F6",
        offwhite: "#F8FAFC",
        charcoal: "#6B7280",
        line: "#E5E7EB",

        primary: "#1E3A8A",
        accent: "#3B82F6",
        reward: "#3B82F6",
        background: "#F8FAFC",
        foreground: "#1F2937",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.06), 0 10px 24px -16px rgba(15,23,42,0.18)",
        glow: "0 18px 40px -24px rgba(30,58,138,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
