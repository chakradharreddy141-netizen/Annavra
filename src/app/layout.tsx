import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'Annavra — Intelligent Nutrition & Fitness Companion',
  description: 'Personalized health, nutrition, workout tracking, and AI food analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${spaceGrotesk.variable} bg-[#07080b] text-[#f3f4f6] min-h-screen font-sans`}>
        {children}
      </body>
    </html>
  );
}
