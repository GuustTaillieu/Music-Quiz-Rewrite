import { Config } from 'tailwindcss';

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        spotify: '#1db954',
        'neon-cyan': '#00f0ff',
        'neon-pink': '#ff007f',
        'bg-dark': '#05070f',
        'card-dark': '#0d1322',
      },
    } as const,
  },
  plugins: [],
} satisfies Config;
