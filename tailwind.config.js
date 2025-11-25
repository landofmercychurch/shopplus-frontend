/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f53d2d',    // Shopee orange
        secondary: '#ec2121',  // Lazada red
        purpleish: '#6b21a8',  // Lazada purple
        lightGray: '#f5f5f5',  // background
        darkGray: '#1f2937',   // text
      },
    },
  },
  plugins: [],
}

