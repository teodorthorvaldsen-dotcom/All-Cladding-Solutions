import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        /** Larger helper / secondary copy site-wide (defaults were 0.75rem / 0.875rem). */
        xs: ["0.875rem", { lineHeight: "1.375rem" }],
        sm: ["1rem", { lineHeight: "1.5rem" }],
      },
    },
  },
  plugins: [],
};
export default config;
