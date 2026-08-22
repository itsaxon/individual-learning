/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        md: "2rem",
        lg: "3rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // 品牌主色
        violet: {
          DEFAULT: "#7C3AED",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        cyan: {
          DEFAULT: "#00E5FF",
          400: "#5EEAFF",
          500: "#00E5FF",
          600: "#00B8D4",
        },
        pink: {
          DEFAULT: "#FF2D95",
          400: "#FF6BB0",
          500: "#FF2D95",
          600: "#DB2777",
        },
        mint: {
          DEFAULT: "#00FFB2",
          400: "#5EFFC9",
          500: "#00FFB2",
        },
        // 背景层级
        ink: {
          DEFAULT: "#05070D",
          50: "#0A0E1A",
          100: "#0F1422",
          200: "#161C2E",
          300: "#1F2638",
        },
      },
      fontFamily: {
        display: ['"Orbitron"', '"PingFang SC"', '"Microsoft YaHei UI"', '"Microsoft YaHei"', '"Hiragino Sans GB"', "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ['"Space Grotesk"', '"PingFang SC"', '"Microsoft YaHei UI"', '"Microsoft YaHei"', '"Hiragino Sans GB"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', '"PingFang SC"', '"Microsoft YaHei UI"', '"Microsoft YaHei"', '"Hiragino Sans GB"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Hero 大标题
        "hero-sm": ["clamp(3rem, 6vw, 5.5rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        hero: ["clamp(3.5rem, 8vw, 7.5rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-1": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2rem, 3.5vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
      backgroundImage: {
        "grad-brand": "linear-gradient(135deg, #7C3AED 0%, #00E5FF 100%)",
        "grad-hot": "linear-gradient(135deg, #FF2D95 0%, #7C3AED 100%)",
        "grad-mint": "linear-gradient(135deg, #00FFB2 0%, #00E5FF 100%)",
        "grad-aurora":
          "radial-gradient(circle at 20% 30%, rgba(124,58,237,0.2), transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,229,255,0.15), transparent 50%), radial-gradient(circle at 50% 50%, rgba(255,45,149,0.13), transparent 60%)",
        "grid-pattern":
          "linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px)",
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(124,58,237,0.4)",
        "glow-cyan": "0 0 40px rgba(0,229,255,0.4)",
        "glow-pink": "0 0 40px rgba(255,45,149,0.4)",
        "glow-mint": "0 0 40px rgba(0,255,178,0.4)",
        "card-glow": "0 30px 60px -20px rgba(124,58,237,0.45), 0 0 30px rgba(0,229,255,0.15)",
        "glass": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "aurora-flow": "aurora-flow 14s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-mid": "float-mid 4.5s ease-in-out infinite",
        "spin-slow": "spin 6s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "shimmer": "shimmer 1.2s linear infinite",
        "neon-border": "neon-border 4s linear infinite",
        "scan-line": "scan-line 8s linear infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "aurora-flow": {
          "0%, 100%": { transform: "translate3d(-5%, -3%, 0) scale(1)", opacity: "0.85" },
          "33%": { transform: "translate3d(5%, 2%, 0) scale(1.05)", opacity: "1" },
          "66%": { transform: "translate3d(-3%, 5%, 0) scale(0.98)", opacity: "0.9" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(0.5deg)" },
        },
        "float-mid": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-9px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "neon-border": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      transitionTimingFunction: {
        "smooth-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
