import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#090a0f] text-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-2xl mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            A
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Annavra</h1>
          <p className="text-sm text-gray-400 mt-1">Disciplined nutrition & fitness intelligence</p>
        </div>
        <div className="bg-[#12141c] border border-[#232738] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}
