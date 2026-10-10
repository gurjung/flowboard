import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        status: {
          todo: {
            DEFAULT: '#64748b',
            light: '#f1f5f9',
            border: '#cbd5e1',
          },
          in_progress: {
            DEFAULT: '#2563eb',
            light: '#eff6ff',
            border: '#bfdbfe',
          },
          done: {
            DEFAULT: '#16a34a',
            light: '#f0fdf4',
            border: '#bbf7d0',
          },
        },
        priority: {
          urgent: '#ef4444',
          high: '#f97316',
          normal: '#3b82f6',
          low: '#64748b',
          none: '#94a3b8',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        panel: '0.75rem',
        card: '0.5rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        popover:
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
