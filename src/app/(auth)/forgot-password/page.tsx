'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1a1a1a] mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Reset your password</h2>
        <p className="text-xs text-[#6b7280] mt-0.5">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {sent ? (
        <div className="p-6 rounded-2xl bg-[#ff4500]/10 border border-[#ff4500]/30 text-center">
          <Mail className="w-8 h-8 text-[#ff4500] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Check your email</h3>
          <p className="text-xs text-[#6b7280] mt-1">
            We sent a password reset link to <strong className="text-[#1a1a1a]">{email}</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#fafafa] border border-[#1a1a1a]/10 text-[#1a1a1a] text-sm focus:outline-none focus:border-[#ff4500] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#ff4500] hover:bg-[#e63e00] disabled:opacity-50 text-gray-950 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
}
