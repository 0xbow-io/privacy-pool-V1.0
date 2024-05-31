import './globals.css';

import { initAnalytics } from '@/utils/analytics';
import { jetBrainMono, inter } from './fonts';
import { generateMetadata } from '@/utils/generateMetadata';

export const metadata = generateMetadata({
  title: 'privacy pool v1',
  description: 'privacy pool v1',
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
    <html lang="en" className={`${jetBrainMono.className}`}>
      <body className="flex flex-1 flex-col">{children}</body>
    </html>
  );
}
