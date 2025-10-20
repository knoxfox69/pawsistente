/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Roboto', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'sans': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      ringColor: {
        'blue': {
          500: '#3B82F6', // This is Tailwind's default blue-500
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
  variants: {
    extend: {
      ringWidth: ['focus'],
      ringColor: ['focus'],
      ringOpacity: ['focus'],
    },
  },
}