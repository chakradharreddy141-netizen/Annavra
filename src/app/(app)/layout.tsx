import React from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-transparent text-[#1a1a1a] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#f7f7f5]/80 backdrop-blur-xl border-b border-[#1a1a1a]/10 px-4 sm:px-8 py-3.5 shadow-[0_4px_30px_rgba(0,240,255,0.05)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ff4500]/10 border border-[#1a1a1a]/10 flex items-center justify-center font-black text-[#ff4500] text-base glow-cyan">
                A
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white font-space">Annavra</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1 ml-8">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Dashboard
              </Link>
              <Link href="/scan" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Scan Food
              </Link>
              <Link href="/nutrition" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Meals
              </Link>
              <Link href="/workout" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Workouts
              </Link>
              <Link href="/progress" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Progress
              </Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:text-[#ff4500] hover:bg-[#ff4500]/10 transition-colors">
                Profile & Goals
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cyber-panel cyber-panel-hover text-xs text-[#1a1a1a]"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#ff4500]" />
              <span className="font-medium max-w-[120px] truncate">{profile?.name || user.email?.split('@')[0]}</span>
            </Link>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                title="Sign out"
                className="p-2 rounded-xl cyber-panel text-[#6b7280] hover:text-[#ef4444] hover:border-[#ef4444]/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area with padding for bottom nav on mobile */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
