import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f1e6",
        card: "#ffffff",
        ink: "#2c241c",
        inkSoft: "#6b6152",
        terracotta: "#bd6f52",
        terracottaDark: "#a85c40",
        gold: "#a9824c",
        line: "#e6dac0",
        darkBtn: "#2c241c",
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
