import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cozy Academia Color Palette
        paper: "#E6E8E3",        // 鼠尾草灰背景
        sidebar: "#F7F4EF",      // 奶油色侧边栏
        "card-cream": "#FDFBF7", // 卡片亮奶油色
        terra: "#D99B83",        // 陶土色 (强调色)
        "terra-dark": "#C08A74", // 陶土色深色 (Hover)
        ink: "#2D2D2D",          // 深灰文字
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
    },
  },
};

export default config;
