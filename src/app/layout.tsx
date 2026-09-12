import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ThreadCursor from '@/components/ui/ThreadCursor';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'Annavra — Intelligent Nutrition & Fitness Companion',
  description: 'Personalized health, nutrition, workout tracking, and AI food analysis.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${spaceGrotesk.variable} bg-[#f7f7f5] text-[#1a1a1a] min-h-screen font-sans selection:bg-[#ff4500] selection:text-white`}>
        <ThreadCursor />
        {children}
      </body>
    </html>
  );
}
