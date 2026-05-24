import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // NXTMUN palette
        ink: {
          DEFAULT: "var(--nxt-ink)",
          2: "var(--nxt-ink-2)",
          3: "var(--nxt-ink-3)",
          4: "var(--nxt-ink-4)",
        },
        paper: {
          DEFAULT: "var(--nxt-paper)",
          soft: "var(--nxt-paper-soft)",
          mute: "var(--nxt-paper-mute)",
          faint: "var(--nxt-paper-faint)",
        },
        blood: {
          DEFAULT: "var(--nxt-blood)",
          bright: "var(--nxt-blood-bright)",
          deep: "var(--nxt-blood-deep)",
        },
        stamp: "var(--nxt-stamp)",

        // Legacy aliases (do not remove — referenced in 300+ files)
        "bg-base": "var(--bg-base)",
        "bg-card": "var(--bg-card)",
        "bg-raised": "var(--bg-raised)",
        "bg-hover": "var(--bg-hover)",
        "bg-dropdown": "var(--bg-dropdown)",
        "bg-dark": "var(--bg-base)",

        "border-subtle": "var(--border-subtle)",
        "border-emphasized": "var(--border-emphasized)",
        "border-strong": "var(--border-strong)",
        "border-input": "var(--border-input)",
        "border-dropdown": "var(--border-dropdown)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "text-disabled": "var(--text-disabled)",
        "text-dimmed": "var(--text-dimmed)",

        "white-pure": "var(--white-pure)",
        "white-accent": "var(--white-accent)",

        // Older accent name still referenced
        "accent-gold": "var(--nxt-paper)",

        "status-approved-bg": "var(--status-approved-bg)",
        "status-approved-text": "var(--status-approved-text)",
        "status-approved-border": "var(--status-approved-border)",
        "status-pending-bg": "var(--status-pending-bg)",
        "status-pending-text": "var(--status-pending-text)",
        "status-pending-border": "var(--status-pending-border)",
        "status-rejected-bg": "var(--status-rejected-bg)",
        "status-rejected-text": "var(--status-rejected-text)",
        "status-rejected-border": "var(--status-rejected-border)",

        // shadcn semantic
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      backgroundColor: {
        base: "var(--bg-base)",
        card: "var(--bg-card)",
        raised: "var(--bg-raised)",
        hover: "var(--bg-hover)",
        dropdown: "var(--bg-dropdown)",
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        emphasized: "var(--border-emphasized)",
        strong: "var(--border-strong)",
        input: "var(--border-input)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        dimmed: "var(--text-dimmed)",
        disabled: "var(--text-disabled)",
        base: "var(--bg-base)",
      },
      fontFamily: {
        // Editorial serif for display
        serif: ["var(--font-serif)", "Bodoni Moda", "Bodoni 72", "Didot", "Times New Roman", "serif"],
        // JetBrains Mono for body / labels — replaces Inter as the new default
        mono: ["var(--font-mono)", "ui-monospace", "JetBrains Mono", "Menlo", "monospace"],
        sans: ["var(--font-mono)", "ui-monospace", "JetBrains Mono", "Menlo", "monospace"],

        // Legacy class names — remapped to NXTMUN fonts
        // font-jotia → display serif (was the previous brand display font)
        jotia: ["var(--font-serif)", "Bodoni Moda", "Didot", "serif"],
        "jotia-bold": ["var(--font-serif)", "Bodoni Moda", "Didot", "serif"],
        // font-inter → mono (was the previous body font; brief bans Inter)
        inter: ["var(--font-mono)", "ui-monospace", "JetBrains Mono", "monospace"],
        display: ["var(--font-serif)", "Bodoni Moda", "Didot", "serif"],
      },
      fontSize: {
        "nav-brand": ["17px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "0.20em" }],
        "nav-link": ["11px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.18em" }],
        "heading-1": ["44px", { lineHeight: "1.05", fontWeight: "600", letterSpacing: "-0.01em" }],
        "heading-2": ["28px", { lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.01em" }],
        "subtitle": ["14px", { lineHeight: "1.6" }],
        "section-label": ["10px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.22em" }],
        "card-title": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-body": ["13px", { lineHeight: "1.6" }],
        "table-header": ["10px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.18em" }],
        "table-cell": ["12px", { lineHeight: "1.5" }],
        "button-text": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.20em" }],
        "badge-text": ["10px", { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.18em" }],
        "form-label": ["10px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.18em" }],
        "form-input": ["13px", { lineHeight: "1.5" }],
        "error-text": ["11px", { lineHeight: "1.4" }],
        "timestamp": ["10px", { lineHeight: "1.4", letterSpacing: "0.10em" }],
      },
      spacing: {
        0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px",
        6: "24px", 7: "28px", 8: "32px", 9: "36px", 10: "40px",
        12: "48px", 14: "56px", 16: "64px", 20: "80px", 24: "96px",
      },
      borderRadius: {
        none: "0px",
        card: "2px",
        button: "0px",
        input: "0px",
        pill: "0px",
        sm: "0px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
      },
      boxShadow: {
        modal: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px var(--nxt-line)",
        none: "none",
        dossier: "0 1px 0 var(--nxt-line), 0 8px 24px rgba(0,0,0,0.55)",
        stamp: "inset 0 0 0 1px var(--nxt-blood-deep)",
      },
      opacity: { 35: "0.35", 60: "0.60" },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "fade-out": { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        "slide-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-left": {
          "0%": { transform: "translateX(-240px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulse: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        shimmer: {
          "0%": { backgroundColor: "var(--nxt-ink-2)" },
          "50%": { backgroundColor: "var(--nxt-ink-3)" },
          "100%": { backgroundColor: "var(--nxt-ink-2)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 150ms ease-out",
        "slide-up": "slide-up 250ms ease-out",
        "slide-down": "slide-down 200ms ease-out",
        "slide-left": "slide-left 250ms ease-out",
        "slide-right": "slide-right 250ms ease-out",
        pulse: "pulse 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        marquee: "marquee 50s linear infinite",
      },
      transitionDuration: {
        100: "100ms", 150: "150ms", 200: "200ms",
        250: "250ms", 300: "300ms", 400: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
