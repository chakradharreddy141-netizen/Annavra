import type { Metadata } from 'next';
import './globals.css';

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
      <body className="bg-[#090a0f] text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
