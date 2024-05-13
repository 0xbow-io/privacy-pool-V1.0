import './globals.css';

import GoogleAnalytics from '@/components/GoogleAnalytics/GoogleAnalytics';
import OnchainProviders from '@/OnchainProviders';
import { initAnalytics } from '@/utils/analytics';
import { inter } from './fonts';
import type { Metadata } from 'next';
import { generateMetadata } from '@/utils/generateMetadata';


export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export const metadata = generateMetadata({
  title: 'Build Onchain Apps Template',
  description:
    'Save weeks of initial app setup and the hassle of integrating onchain components with web2 infrastructure.',
  images: 'themes.png',
  pathname: '',
});

// Stat analytics before the App renders,
// so we can track page views and early events
initAnalytics();

/** Root layout to define the structure of every page
 * https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <body className="flex flex-1 flex-col">
        <OnchainProviders>{children}</OnchainProviders>
      </body>
      <GoogleAnalytics />
    </html>
  );
}
