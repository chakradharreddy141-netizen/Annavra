'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  UtensilsCrossed, 
  Dumbbell, 
  LineChart, 
  UserCircle,
  Plus
} from 'lucide-react';
import LogActionDrawer from './LogActionDrawer';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/nutrition', label: 'Meals', icon: UtensilsCrossed },
  { type: 'log', label: 'Log', icon: Plus },
  { href: '/workout', label: 'Workout', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: LineChart },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#1a1a1a]/10 px-2 py-1.5 safe-bottom sm:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around relative">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            
            if (item.type === 'log') {
              return (
                <button
                  key="log-action"
                  onClick={() => setIsLogDrawerOpen(true)}
                  className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#ff4500] to-[#ff6b33] text-white shadow-lg shadow-[#ff4500]/30 hover:scale-105 active:scale-95 transition-all z-10 border-4 border-[#f7f7f5]"
                >
                  <Icon className="w-6 h-6 stroke-[3]" />
                </button>
              );
            }

            const isActive = item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));

            return (
              <Link
                key={item.href || idx}
                href={item.href || '#'}
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

      <LogActionDrawer 
        isOpen={isLogDrawerOpen} 
        onClose={() => setIsLogDrawerOpen(false)} 
      />
    </>
  );
}
