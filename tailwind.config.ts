import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ──────────────────────────────────────────────
       * ASCO Brand Colors — Single Source of Truth
       * All values reference CSS custom properties (HSL)
       * ────────────────────────────────────────────── */
      colors: {
        /* — Shadcn semantic tokens (mapped to ASCO in index.css) — */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* — ASCO Brand: Cobalt (primary dark) — */
        cobalt: {
          deep: "hsl(var(--cobalt-deep))",
          DEFAULT: "hsl(var(--cobalt))",
          light: "hsl(var(--cobalt-light))",
          lighter: "hsl(var(--cobalt-lighter))",
          foreground: "hsl(var(--cobalt-foreground))",
        },

        /* — ASCO Brand: Pale Blue (secondary light) — */
        "pale-blue": "hsl(var(--pale-blue))",

        /* — ASCO Brand: Teal (accent/CTA) — */
        "asco-teal": {
          DEFAULT: "hsl(var(--asco-teal))",
          foreground: "hsl(var(--asco-teal-foreground))",
        },

        /* — ASCO Brand: Muted Grey — */
        "muted-grey": "hsl(var(--muted-grey))",

        /* — Status colors — */
        status: {
          new: "hsl(var(--status-new))",
          active: "hsl(var(--status-active))",
          complete: "hsl(var(--status-complete))",
          urgent: "hsl(var(--status-urgent))",
          waiting: "hsl(var(--status-waiting))",
        },
      },

      /* — ASCO Fonts — */
      fontFamily: {
        heading: ["'PP Neue Machina'", "Arial", "sans-serif"],
        body: ["'TT Commons Pro'", "Arial", "sans-serif"],
      },

      /* — ASCO Spacing — */
      spacing: {
        touch: "3.5rem", /* 56px — mobile touch target */
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },

      screens: {
        xs: "475px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1280px",
      },

      /* — ASCO Border Radius — */
      borderRadius: {
        brand: "8px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* — ASCO Shadows — */
      boxShadow: {
        "brand-sm": "0 2px 8px -2px hsl(var(--cobalt) / 0.08)",
        "brand-lg": "0 8px 24px -4px hsl(var(--cobalt) / 0.12)",
      },

      /* — Animations (preserved) — */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(0)", opacity: "1" },
          to: { transform: "translateY(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
