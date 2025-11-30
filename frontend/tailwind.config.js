export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20', // Verde escuro
          light: '#2E7D32',
          dark: '#0D3A0D',
        },
        secondary: {
          DEFAULT: '#E0E0E0', // Cinza claro
          light: '#F5F5F5',
          dark: '#9E9E9E',
        }
      }
    },
  },
  plugins: [],
}