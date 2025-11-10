import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        input: {
          background: "var(--input-background)",
          foreground: "var(--input-foreground)",
          border: "var(--input-border)",
          placeholder: "var(--input-placeholder)",
        },
        button: {
          primary: {
            background: "var(--button-primary-background)",
            foreground: "var(--button-primary-foreground)",
          },
          secondary: {
            background: "var(--button-secondary-background)",
            foreground: "var(--button-secondary-foreground)",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
