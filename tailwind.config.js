/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E60000",
          purple: "#660099",
          ink: "#2B1242",
          soft: "#F5F2F8",
        },
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
