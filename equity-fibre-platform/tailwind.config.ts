import type { Config } from "tailwindcss";

// Brand palette is intentionally calm and trustworthy (see docs/UI notes and
// src/lib/config/brand.ts). Colours can be re-themed from one place.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#bcdcff",
          300: "#8ec6ff",
          400: "#59a6ff",
          500: "#3385f6",
          600: "#1f66db",
          700: "#1a51b0",
          800: "#1b458c",
          900: "#1c3d73",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          faint: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
