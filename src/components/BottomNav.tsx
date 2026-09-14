'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Scan, 
  UtensilsCrossed, 
  Dumbbell, 
  LineChart, 
  UserCircle 
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/scan', label: 'Scan', icon: Scan },
  { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#1a1a1a]/10 px-2 py-1.5 safe-bottom sm:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 py-1 transition-all ${
                isActive ? 'text-[#ff4500]' : 'text-[#6b7280] hover:text-[#1a1a1a]'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all ${isActive ? 'bg-[#ff4500]/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wide mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
