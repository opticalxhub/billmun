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
        // Background and surfaces
        "bg-base": "var(--bg-base)",
        "bg-card": "var(--bg-card)",
        "bg-raised": "var(--bg-raised)",
        "bg-hover": "var(--bg-hover)",
        "bg-dropdown": "var(--bg-dropdown)",
        
        // Borders
        "border-subtle": "var(--border-subtle)",
        "border-emphasized": "var(--border-emphasized)",
        "border-strong": "var(--border-strong)",
        "border-input": "var(--border-input)",
        "border-dropdown": "var(--border-dropdown)",
        
        // Text
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "text-disabled": "var(--text-disabled)",
        "text-dimmed": "var(--text-dimmed)",
        
        // Special
        "white-pure": "var(--white-pure)",
        "white-accent": "var(--white-accent)",
        
        // Status colors (monochromatic)
        "status-approved-bg": "var(--status-approved-bg)",
        "status-approved-text": "var(--status-approved-text)",
        "status-approved-border": "var(--status-approved-border)",
        "status-pending-bg": "var(--status-pending-bg)",
        "status-pending-text": "var(--status-pending-text)",
        "status-pending-border": "var(--status-pending-border)",
        "status-rejected-bg": "var(--status-rejected-bg)",
        "status-rejected-text": "var(--status-rejected-text)",
        "status-rejected-border": "var(--status-rejected-border)",
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
        "jotia": ["Jotia W00 Regular", "sans-serif"],
        "jotia-bold": ["Jotia W00 Regular", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
      },
      fontSize: {
        "nav-brand": ["17px", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "0.08em" }],
        "nav-link": ["13px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.05em" }],
        "heading-1": ["40px", { lineHeight: "1.15", fontWeight: "700" }],
        "heading-2": ["28px", { lineHeight: "1.15", fontWeight: "700" }],
        "subtitle": ["15px", { lineHeight: "1.6" }],
        "section-label": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.14em" }],
        "card-title": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-body": ["13px", { lineHeight: "1.55" }],
        "table-header": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.1em" }],
        "table-cell": ["13px", { lineHeight: "1.5" }],
        "button-text": ["13px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.04em" }],
        "badge-text": ["11px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.06em" }],
        "form-label": ["12px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.04em" }],
        "form-input": ["14px", { lineHeight: "1.5" }],
        "error-text": ["12px", { lineHeight: "1.4" }],
        "timestamp": ["11px", { lineHeight: "1.4" }],
      },
      spacing: {
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        12: "48px",
        14: "56px",
        16: "64px",
        20: "80px",
      },
      borderRadius: {
        none: "0px",
        card: "6px",
        button: "4px",
        input: "4px",
        pill: "20px",
      },
      boxShadow: {
        modal: "0 8px 32px rgba(0, 0, 0, 0.7)",
        none: "none",
      },
      opacity: {
        35: "0.35",
        60: "0.60",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
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
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        shimmer: {
          "0%": { backgroundColor: "#161616" },
          "50%": { backgroundColor: "#202020" },
          "100%": { backgroundColor: "#161616" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 150ms ease-out",
        "slide-up": "slide-up 250ms ease-out",
        "slide-down": "slide-down 200ms ease-out",
        "slide-left": "slide-left 250ms ease-out",
        "slide-right": "slide-right 250ms ease-out",
        pulse: "pulse 1.2s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      transitionDuration: {
        100: "100ms",
        150: "150ms",
        200: "200ms",
        250: "250ms",
        300: "300ms",
        400: "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
