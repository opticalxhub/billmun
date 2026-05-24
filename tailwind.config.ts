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
        /* ── Surfaces ──────────────────────────────────────────── */
        "bg-base":        "var(--bg-base)",
        "bg-card":        "var(--bg-card)",
        "bg-raised":      "var(--bg-raised)",
        "bg-hover":       "var(--bg-hover)",
        "bg-dropdown":    "var(--bg-dropdown)",
        "bg-cork":        "var(--bg-cork)",

        /* ── Borders ───────────────────────────────────────────── */
        "border-subtle":     "var(--border-subtle)",
        "border-emphasized": "var(--border-emphasized)",
        "border-strong":     "var(--border-strong)",
        "border-input":      "var(--border-input)",
        "border-rust":       "var(--border-rust)",

        /* ── Text ──────────────────────────────────────────────── */
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary":  "var(--text-tertiary)",
        "text-disabled":  "var(--text-disabled)",
        "text-dimmed":    "var(--text-dimmed)",
        "text-rust":      "var(--text-rust)",

        /* ── Rust accent scale ─────────────────────────────────── */
        "rust-900": "var(--rust-900)",
        "rust-800": "var(--rust-800)",
        "rust-700": "var(--rust-700)",
        "rust-600": "var(--rust-600)",
        "rust-500": "var(--rust-500)",
        "rust-400": "var(--rust-400)",
        "rust-300": "var(--rust-300)",
        "rust-200": "var(--rust-200)",
        "rust-100": "var(--rust-100)",

        /* ── Special ───────────────────────────────────────────── */
        "white-pure":   "var(--white-pure)",
        "white-accent": "var(--white-accent)",

        /* ── Status ────────────────────────────────────────────── */
        "status-approved-bg":     "var(--status-approved-bg)",
        "status-approved-text":   "var(--status-approved-text)",
        "status-approved-border": "var(--status-approved-border)",
        "status-pending-bg":      "var(--status-pending-bg)",
        "status-pending-text":    "var(--status-pending-text)",
        "status-pending-border":  "var(--status-pending-border)",
        "status-rejected-bg":     "var(--status-rejected-bg)",
        "status-rejected-text":   "var(--status-rejected-text)",
        "status-rejected-border": "var(--status-rejected-border)",
        "status-warning-bg":      "var(--status-warning-bg)",
        "status-warning-text":    "var(--status-warning-text)",
        "status-warning-border":  "var(--status-warning-border)",

        /* ── Corkboard ─────────────────────────────────────────── */
        "pin-rust":   "var(--pin-rust)",
        "paper-aged": "var(--paper-aged)",
      },

      backgroundColor: {
        base:     "var(--bg-base)",
        card:     "var(--bg-card)",
        raised:   "var(--bg-raised)",
        hover:    "var(--bg-hover)",
        dropdown: "var(--bg-dropdown)",
        cork:     "var(--bg-cork)",
      },

      borderColor: {
        subtle:     "var(--border-subtle)",
        emphasized: "var(--border-emphasized)",
        strong:     "var(--border-strong)",
        input:      "var(--border-input)",
        rust:       "var(--border-rust)",
      },

      textColor: {
        primary:   "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary:  "var(--text-tertiary)",
        dimmed:    "var(--text-dimmed)",
        disabled:  "var(--text-disabled)",
        rust:      "var(--text-rust)",
        base:      "var(--bg-base)",
      },

      fontFamily: {
        /* Barlow Condensed — condensed editorial headings */
        "condensed": ["var(--font-barlow-condensed)", "Barlow Condensed", "sans-serif"],
        /* Barlow — warm humanist body */
        "sans":      ["var(--font-barlow)", "Barlow", "sans-serif"],
        "barlow":    ["var(--font-barlow)", "Barlow", "sans-serif"],
        /* JetBrains Mono — sharp mono for data */
        "mono":      ["var(--font-mono)", "JetBrains Mono", "monospace"],

        /* Legacy aliases so existing code doesn't break */
        "jotia":     ["var(--font-barlow-condensed)", "Barlow Condensed", "sans-serif"],
        "jotia-bold":["var(--font-barlow-condensed)", "Barlow Condensed", "sans-serif"],
        "inter":     ["var(--font-barlow)", "Barlow", "sans-serif"],
      },

      fontSize: {
        /* Display */
        "display-xl": ["clamp(3rem, 8vw, 6rem)",      { lineHeight: "0.95", fontWeight: "800", letterSpacing: "-0.01em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)",  { lineHeight: "0.98", fontWeight: "700", letterSpacing: "0.01em"  }],
        "display-md": ["clamp(1.8rem, 4vw, 3rem)",    { lineHeight: "1.05", fontWeight: "700", letterSpacing: "0.01em"  }],

        /* Headings */
        "heading-1":  ["2.5rem",  { lineHeight: "1.1",  fontWeight: "700" }],
        "heading-2":  ["1.75rem", { lineHeight: "1.15", fontWeight: "700" }],
        "heading-3":  ["1.25rem", { lineHeight: "1.2",  fontWeight: "600" }],

        /* UI labels */
        "nav-brand":     ["17px",  { lineHeight: "1.2", fontWeight: "700", letterSpacing: "0.1em"  }],
        "nav-link":      ["13px",  { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.06em" }],
        "section-label": ["11px",  { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.18em" }],
        "card-title":    ["18px",  { lineHeight: "1.25",fontWeight: "600"  }],
        "card-body":     ["13px",  { lineHeight: "1.6"  }],
        "table-header":  ["10px",  { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.14em" }],
        "table-cell":    ["13px",  { lineHeight: "1.5"  }],
        "button-text":   ["12px",  { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.08em" }],
        "badge-text":    ["10px",  { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.1em"  }],
        "form-label":    ["11px",  { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.08em" }],
        "form-input":    ["14px",  { lineHeight: "1.5"  }],
        "error-text":    ["12px",  { lineHeight: "1.4"  }],
        "timestamp":     ["10px",  { lineHeight: "1.4" }],
        "mono-data":     ["12px",  { lineHeight: "1.5" }],

        /* Subtitle */
        "subtitle": ["15px", { lineHeight: "1.65" }],
      },

      borderRadius: {
        none:    "0px",
        card:    "4px",    /* polaroid-style: tight radius */
        button:  "3px",
        input:   "3px",
        pill:    "9999px",
      },

      boxShadow: {
        /* Polaroid card shadow */
        "card-raised": "0 6px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
        "card-flat":   "0 2px 12px rgba(0,0,0,0.4)",
        "pin":         "0 3px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
        "modal":       "0 16px 48px rgba(0,0,0,0.8)",
        "none":        "none",
      },

      opacity: {
        35: "0.35",
        60: "0.60",
      },

      keyframes: {
        "fade-in":    { "0%": { opacity: "0" },                                         "100%": { opacity: "1" }                                        },
        "fade-out":   { "0%": { opacity: "1" },                                         "100%": { opacity: "0" }                                        },
        "slide-up":   { "0%": { transform: "translateY(12px)", opacity: "0" },          "100%": { transform: "translateY(0)", opacity: "1" }             },
        "slide-down": { "0%": { transform: "translateY(-8px)", opacity: "0" },          "100%": { transform: "translateY(0)", opacity: "1" }             },
        "slide-left": { "0%": { transform: "translateX(-240px)", opacity: "0" },        "100%": { transform: "translateX(0)", opacity: "1" }             },
        "slide-right":{ "0%": { transform: "translateX(100%)", opacity: "0" },          "100%": { transform: "translateX(0)", opacity: "1" }             },
        "pulse":      { "0%, 100%": { opacity: "1" },                                  "50%": { opacity: "0.35" }                                       },
        "shimmer":    { "0%": { transform: "translateX(-100%)" },                       "100%": { transform: "translateX(100%)" }                       },
        "pin-drop":   { "0%": { transform: "translateY(-12px) scale(0.8)", opacity: "0" }, "60%": { transform: "translateY(2px) scale(1.05)", opacity: "1" }, "100%": { transform: "translateY(0) scale(1)", opacity: "1" } },
        "card-reveal":{ "0%": { transform: "translateY(10px)", opacity: "0" },          "100%": { transform: "translateY(0)", opacity: "1" }             },
        "stamp-press":{ "0%": { transform: "rotate(-8deg) scale(1.4)", opacity: "0" }, "60%": { transform: "rotate(-8deg) scale(0.95)", opacity: "0.9"  }, "100%": { transform: "rotate(-8deg) scale(1)", opacity: "0.85" } },
        "pulse-rust": { "0%, 100%": { opacity: "1" },                                  "50%": { opacity: "0.4" }                                        },
      },

      animation: {
        "fade-in":    "fade-in 200ms ease-out",
        "fade-out":   "fade-out 150ms ease-out",
        "slide-up":   "slide-up 280ms ease-out",
        "slide-down": "slide-down 220ms ease-out",
        "slide-left": "slide-left 280ms ease-out",
        "slide-right":"slide-right 280ms ease-out",
        "pulse":      "pulse 1.4s ease-in-out infinite",
        "shimmer":    "shimmer 1.8s ease-in-out infinite",
        "pin-drop":   "pin-drop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "card-reveal":"card-reveal 350ms ease-out",
        "stamp-press":"stamp-press 500ms ease-out forwards",
        "pulse-rust": "pulse-rust 2s ease-in-out infinite",
      },

      transitionDuration: {
        100: "100ms",
        150: "150ms",
        200: "200ms",
        250: "250ms",
        300: "300ms",
        400: "400ms",
      },

      spacing: {
        "0":  "0px",
        "1":  "4px",
        "2":  "8px",
        "3":  "12px",
        "4":  "16px",
        "5":  "20px",
        "6":  "24px",
        "7":  "28px",
        "8":  "32px",
        "9":  "36px",
        "10": "40px",
        "12": "48px",
        "14": "56px",
        "16": "64px",
        "20": "80px",
      },
    },
  },
  plugins: [],
};

export default config;
