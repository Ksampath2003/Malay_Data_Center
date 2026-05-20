import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Institutional palette — deep navy, electric blue, amber
        ink: {
          950: "#070B14",
          900: "#0B1220",
          800: "#111A2E",
          700: "#1A2540",
          600: "#243353",
          500: "#33456A",
          400: "#56688B",
          300: "#8497B8",
          200: "#B7C3DA",
          100: "#DCE3F0",
          50: "#EEF2FA",
        },
        accent: {
          // Electric blue
          500: "#3B82F6",
          400: "#60A5FA",
          600: "#2563EB",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
        },
        good: "#34D399",
        warn: "#F59E0B",
        bad: "#F87171",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
      maxWidth: {
        content: "1400px",
      },
      boxShadow: {
        panel:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
