import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1a1a]/50 p-8 rounded-2xl border border-white/10 text-center shadow-xl">
        <div className="w-16 h-16 bg-[#ff4500]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 tracking-tight">This page doesn't exist</h2>
        
        <p className="text-[#a1a1aa] mb-8">
          The route you're looking for isn't available. It might have been moved or deleted.
        </p>

        <Link 
          href="/"
          className="block w-full bg-[#ff4500] hover:bg-[#ff4500]/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
