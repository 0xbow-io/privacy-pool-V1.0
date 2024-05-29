import { Roboto_Mono, Inter, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

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

export const ibmPlexSans = IBM_Plex_Mono({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  style: 'normal',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
});
