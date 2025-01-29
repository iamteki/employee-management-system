import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#171717',
        card: '#ffffff',
        'card-foreground': '#171717',
        primary: '#2563eb',
        'primary-foreground': '#ffffff',
        secondary: '#f3f4f6',
        'secondary-foreground': '#171717',
        destructive: '#dc2626',
        'destructive-foreground': '#ffffff',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#2563eb',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;