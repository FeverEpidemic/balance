import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-strong": "var(--primary-strong)",
        "primary-soft": "var(--primary-soft)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        border: "var(--border)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        success: "var(--success)",
        danger: "var(--danger)",
        card: "var(--card)",
        "card-elevated": "var(--card-elevated)"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        label: ["var(--font-label)", "sans-serif"]
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem"
      },
      boxShadow: {
        serene: "0 4px 20px -2px rgba(45, 54, 39, 0.05)",
        float: "0 12px 40px -4px rgba(45, 54, 39, 0.1)"
      },
      maxWidth: {
        app: "1280px"
      }
    }
  },
  plugins: []
};

export default config;
