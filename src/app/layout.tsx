import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'snip — Small links. Big possibilities.', description: 'A simple, local URL shortener. Make long links a little lighter.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
