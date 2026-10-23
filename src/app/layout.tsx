import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TV Social Platform — Staff Control Center',
  description: 'Internal security and moderation administration dashboard',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
