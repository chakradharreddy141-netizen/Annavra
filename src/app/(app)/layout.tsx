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
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-[#232738] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-base shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                A
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">Annavra</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1 ml-8">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Dashboard
              </Link>
              <Link href="/scan" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Scan Food
              </Link>
              <Link href="/nutrition" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Meals
              </Link>
              <Link href="/workout" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Workouts
              </Link>
              <Link href="/progress" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Progress
              </Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#181b26] transition-colors">
                Profile & Goals
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#181b26] border border-[#232738] text-xs text-gray-200 hover:border-gray-700 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium max-w-[120px] truncate">{profile?.name || user.email?.split('@')[0]}</span>
            </Link>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                title="Sign out"
                className="p-2 rounded-xl bg-[#181b26] border border-[#232738] text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
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
