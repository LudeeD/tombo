const colors = require("tailwindcss/colors");

module.exports = {
  theme: {
    extend: {
      colors: {
        mint: "#E8F5F2",
        mintAccent: "#B8E6D9",
        peach: "#FFF0E8",
        peachAccent: "#FFD4BF",
        lavender: "#F3F0FF",
        lavenderAccent: "#E0D4FF",
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          700: "#404040",
          800: "#262626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-soft": "bounceSoft 0.4s ease-out",
      },
    },
  },
};
