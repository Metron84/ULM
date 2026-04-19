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
        forest: "#0A3D2A",
        sage: "#A8CABA",
        gold: "#D4AF77",
        offwhite: "#F8F5F0",
        charcoal: "#2C2C2C",
        line: "#E5E0D8",

        primary: "#0A3D2A",
        accent: "#A8CABA",
        reward: "#D4AF77",
        background: "#F8F5F0",
        foreground: "#2C2C2C",
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
        soft: "0 1px 2px rgba(10,61,42,0.04), 0 8px 24px -12px rgba(10,61,42,0.08)",
        glow: "0 20px 60px -20px rgba(10,61,42,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
