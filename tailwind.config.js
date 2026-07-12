/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors - 温暖柔和的配色
        primary: {
          50: '#FEF8F4',
          100: '#FDE9DC',
          200: '#F8D4B0',
          300: '#EDBF84',
          400: '#D4A574',
          500: '#C9945D',
          600: '#B8834D',
          700: '#9B703D',
          800: '#7E5C31',
          900: '#634827',
        },
        // 灰色系
        gray: {
          50: '#FAFAF9',
          100: '#F5F1ED',
          200: '#E8E8E8',
          300: '#E5E5E5',
          400: '#A0A0A0',
          500: '#808080',
          600: '#6B6B6B',
          700: '#505050',
          800: '#2C2C2C',
          900: '#1A1918',
        },
        // 事件分类色
        category: {
          education: '#6B8DD6', // 学业 - 蓝色
          work: '#7BA362',      // 工作 - 绿色
          life: '#D4A574',      // 生活 - 棕色
          travel: '#9B7BA3',    // 旅行 - 紫色
          love: '#E8878D',      // 感情 - 粉红
          health: '#D68E6D',    // 健康 - 橙红
          achievement: '#F0C674', // 成就 - 金色
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px rgba(0,0,0,0.08)',
        'lg': '0 10px 15px rgba(0,0,0,0.1)',
        'warm': '0 4px 12px rgba(212,165,116,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
