import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f2e8",
        bg2: "#eee2cc",
        card: "#ffffff",
        ink: "#24252b",
        inkSoft: "#605f68",
        terracotta: "#92764f",
        terracottaDark: "#6e5638",
        gold: "#a9835a",
        line: "#e3d5ba",
        darkBtn: "#2c2e35",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
