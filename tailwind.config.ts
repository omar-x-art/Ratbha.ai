import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Surface
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        border: "hsl(var(--border))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // Brand: Siraj green
        primary: {
          50: "#EEFAEB",
          100: "#D8F2D0",
          200: "#BBE7AB",
          300: "#9BDA84",
          400: "#83CD66",
          500: "#6CC04A",
          600: "#4FA432",
          700: "#3B7E26",
          800: "#2C5F1D",
          900: "#1F4515",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Brand: Omar bronze
        secondary: {
          50: "#FAF3EA",
          100: "#F2E5D0",
          200: "#ECDBC2",
          300: "#DCBE96",
          400: "#CFA572",
          500: "#C28B4F",
          600: "#A6743D",
          700: "#8E5F30",
          800: "#6E4924",
          900: "#4F341A",
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        bubble: {
          user: "hsl(var(--bubble-user))",
          ai: "hsl(var(--bubble-ai))",
          system: "hsl(var(--bubble-system))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        bubble: "18px",
        card: "16px",
        chip: "999px",
        composer: "24px",
        button: "14px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,20,.04), 0 1px 1px rgba(20,20,20,.03)",
        composer: "0 -2px 12px rgba(20,20,20,.06)",
        avatar: "0 2px 8px rgba(108,192,74,.12)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "typing-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 200ms ease-out",
        "typing-bounce": "typing-bounce 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
