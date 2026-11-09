/**
 * Typed palette reference for design tooling and editors.
 * Tailwind CSS v4 generates the active theme from src/app/globals.css @theme;
 * this legacy-shaped object is intentionally not loaded as a v4 runtime config.
 */
export const musePalette = {
  primary: "#2D5A27",
  background: "#F4F9F9",
  water: "#E0F2FE",
  accent: "#B87333",
  text: "#1E293B",
} as const;

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: musePalette.primary,
        background: musePalette.background,
        water: musePalette.water,
        accent: musePalette.accent,
        text: musePalette.text,
      },
    },
  },
} as const;

export default tailwindConfig;
