import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FLAIRO Control Center',
  description:
    'Employee operations workspace for FLAIRO resident benefit program management.',
  openGraph: {
    title: 'FLAIRO Control Center',
    description:
      'Employee operations workspace for vendor compliance, job control, resident rewards, invoices, and community reporting.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FLAIRO Control Center',
    description:
      'Employee operations workspace for FLAIRO resident benefit program management.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
