/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
  ],
  presets: [
    require('nativewind/preset')
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        primaryDark: '#C2185B',
        primaryLight: '#F8BBD0',
        secondary: '#4CAF50',
        secondaryDark: '#388E3C',
        secondaryLight: '#C8E6C9',
        accent: '#FF9800',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        error: '#D32F2F',
        warning: '#F57C00',
        success: '#388E3C',
        textPrimary: '#212121',
        textSecondary: '#757575',
        textDisabled: '#BDBDBD',
        border: '#E0E0E0',
        divider: '#EEEEEE',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        round: '9999px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}