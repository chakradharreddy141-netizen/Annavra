import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#f7f7f5] text-[#1a1a1a]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ff4500]/10 border border-[#ff4500]/30 text-[#ff4500] font-bold text-2xl mb-3 shadow-[0_0_20px_rgba(255,69,0,0.1)]">
            A
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a1a]">Annavra</h1>
          <p className="text-sm text-[#6b7280] mt-1">Disciplined nutrition & fitness intelligence</p>
        </div>
        <div className="bg-[#ffffff] border border-[#1a1a1a]/10 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
