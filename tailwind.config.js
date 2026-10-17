/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#ECFDF5",
        },
        accent: "#F59E0B",
        info: "#3B82F6",
        danger: "#EF4444",
        ink: "#1F2937",
        muted: "#6B7280",
        line: "#E5E7EB",
        surface: "#FFFFFF",
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Vazirmatn", "Tahoma", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.12)",
        soft: "0 1px 3px rgba(16, 24, 40, 0.06)",
        pop: "0 12px 32px -8px rgba(16, 24, 40, 0.18)",
      },
      maxWidth: {
        content: "1240px",
        app: "1440px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
