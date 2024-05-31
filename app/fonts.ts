import { Roboto_Mono, Inter, JetBrains_Mono } from 'next/font/google';

export const roboto = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const jetBrainMono = JetBrains_Mono({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: 'normal',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});
