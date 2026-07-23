import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#C9A84C",
          bg: "#0D0D0D",
          card: "#141414",
          surface: "#1C1C1C",
          border: "#2A2A2A",
          "text-primary": "#F0EDE6",
          "text-secondary": "#A89F8C",
        },
      },
      fontFamily: {
        playfair: ["var(--font-serif)", "Georgia", "serif"],
        sans:     ["var(--font-sans)",  "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
