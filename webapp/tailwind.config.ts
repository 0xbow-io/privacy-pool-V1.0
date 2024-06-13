import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        'bone-chine': '#F3EDDE',
        'green-venom': '#B8F818',
        'brain-freeze': '#00EEFF',
        'sidingo': '#4302B2',
        'blackmail': '#220066',
        'black-htun': '#110033',
        'silver-bird': '#FBF5F0',
        'soft-sunset': '#F2E3D8',
        'holy-canoli': '#DB783E',
        'rum-punch': '#AA423A',
        'tropical-forest': '#024A43',
        'guerrilla-forest': '#142D25',
        'ghost-white': '#F7F8FC',
        'federal-blue': '#040444',
        'lavender': '#DEE5FF',
        'cornflower-blue': '#769AFF',
        'perlwinkle': '#B8D2FF',
        'doctor': '#F9F9F9',
        'coquette': '#E5DCDC',
        'broadway-lights': '#FEE07C',
        'rust-effect': '#BB3344',
        'lifeline': '#990033',
        'umbra': '#211E1F',
        'orange-dim': '#DD6E42',
        'yellow-dim': '#E8DAB2',
        'blue-dim': '#4F6D7A',
        'light-blue-dim': '#C0D6DF',
        'white-dim': '#EAEAEA',
        'toxic-orange': '#FF6037',

        'dominant-blue': '#0d1695',
        'bright-grey': '#EBECF0',
        'royal-nightfall': '#0B173D',
        'blue-wisp': '#CDD6EE',
        'royal-saphire': '#1E42AC',
        'indingo-wisp': '#D6CDEE',
        'purple-wisp': '#E6CDEE',

        'strong-blue': '#0F1939',
        'mystic-blue': '#669BBC',

        'light-blue': '#516AC8',
        'cool-green': '#216B88',
        'bold-green': '#003049',

        'cool-grey': '#BCC8CC',
        'blend-grey': '#DFDDE0',
        'grey-10': '#f4f4f4',
        'cool-grey-50': '#a2a9b0',

        'light-skin': '#FAEBD7',

        'calming-white': '#fff7e9',
        'vanilla-cream': '#fdf0d5',

        'font-color': '#0d1695',
        'border-color': '#0d1695',
        'page-background': '#EBECF0',

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'border-beam': {
          '100%': {
            'offset-distance': '100%',
          },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        moveHorizontal: {
          '0%': {
            transform: 'translateX(-50%) translateY(-10%)',
          },
          '50%': {
            transform: 'translateX(50%) translateY(10%)',
          },
          '100%': {
            transform: 'translateX(-50%) translateY(-10%)',
          },
        },
        moveInCircle: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '50%': {
            transform: 'rotate(180deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        moveVertical: {
          '0%': {
            transform: 'translateY(-50%)',
          },
          '50%': {
            transform: 'translateY(50%)',
          },
          '100%': {
            transform: 'translateY(-50%)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        first: 'moveVertical 30s ease infinite',
        second: 'moveInCircle 20s reverse infinite',
        third: 'moveInCircle 40s linear infinite',
        fourth: 'moveHorizontal 40s ease infinite',
        fifth: 'moveInCircle 20s ease infinite',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
