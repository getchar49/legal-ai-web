import type { Config } from "tailwindcss";

/**
 * Every color in the palette is resolved from a CSS variable that lives in
 * `app/globals.css`. The variable holds an `R G B` triplet so Tailwind's
 * `<alpha-value>` placeholder keeps working with every opacity modifier
 * (e.g. `bg-primary/30`, `border-outline-variant/15`). The same class name
 * therefore adapts to light/dark automatically based on the `dark` class on
 * `<html>`.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("--color-background"),
        surface: token("--color-surface"),
        "surface-bright": token("--color-surface-bright"),
        "surface-dim": token("--color-surface-dim"),
        "surface-container-lowest": token("--color-surface-container-lowest"),
        "surface-container-low": token("--color-surface-container-low"),
        "surface-container": token("--color-surface-container"),
        "surface-container-high": token("--color-surface-container-high"),
        "surface-container-highest": token("--color-surface-container-highest"),
        "surface-variant": token("--color-surface-variant"),
        "surface-tint": token("--color-surface-tint"),
        "inverse-surface": token("--color-inverse-surface"),
        "inverse-on-surface": token("--color-inverse-on-surface"),
        "inverse-primary": token("--color-inverse-primary"),

        "on-surface": token("--color-on-surface"),
        "on-surface-variant": token("--color-on-surface-variant"),
        "on-background": token("--color-on-background"),

        outline: token("--color-outline"),
        "outline-variant": token("--color-outline-variant"),

        primary: token("--color-primary"),
        "on-primary": token("--color-on-primary"),
        "primary-container": token("--color-primary-container"),
        "on-primary-container": token("--color-on-primary-container"),
        "primary-fixed": token("--color-primary-fixed"),
        "primary-fixed-dim": token("--color-primary-fixed-dim"),
        "on-primary-fixed": token("--color-on-primary-fixed"),
        "on-primary-fixed-variant": token("--color-on-primary-fixed-variant"),

        secondary: token("--color-secondary"),
        "on-secondary": token("--color-on-secondary"),
        "secondary-container": token("--color-secondary-container"),
        "on-secondary-container": token("--color-on-secondary-container"),
        "secondary-fixed": token("--color-secondary-fixed"),
        "secondary-fixed-dim": token("--color-secondary-fixed-dim"),
        "on-secondary-fixed": token("--color-on-secondary-fixed"),
        "on-secondary-fixed-variant": token("--color-on-secondary-fixed-variant"),

        tertiary: token("--color-tertiary"),
        "on-tertiary": token("--color-on-tertiary"),
        "tertiary-container": token("--color-tertiary-container"),
        "on-tertiary-container": token("--color-on-tertiary-container"),
        "tertiary-fixed": token("--color-tertiary-fixed"),
        "tertiary-fixed-dim": token("--color-tertiary-fixed-dim"),
        "on-tertiary-fixed": token("--color-on-tertiary-fixed"),
        "on-tertiary-fixed-variant": token("--color-on-tertiary-fixed-variant"),

        error: token("--color-error"),
        "on-error": token("--color-on-error"),
        "error-container": token("--color-error-container"),
        "on-error-container": token("--color-on-error-container"),
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
    },
  },
};

export default config;
