'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ScanLine, 
  Dumbbell, 
  Plus,
  UtensilsCrossed
} from 'lucide-react';

export default function LogActionDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#f7f7f5] rounded-t-3xl shadow-2xl safe-bottom"
          >
            <div className="w-full flex justify-center py-3">
              <div className="w-12 h-1.5 bg-[#1a1a1a]/10 rounded-full" />
            </div>

            <div className="p-6 pt-2 space-y-4">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">What would you like to log?</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <Link
                  href="/scan"
                  onClick={onClose}
                  className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-[#1a1a1a]/5 hover:border-[#ff4500]/30 hover:bg-[#ff4500]/5 transition-colors shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ff4500]/10 flex items-center justify-center text-[#ff4500]">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a] text-center">Scan Meal</span>
                </Link>

                <Link
                  href="/nutrition"
                  onClick={onClose}
                  className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-[#1a1a1a]/5 hover:border-[#ff4500]/30 hover:bg-[#ff4500]/5 transition-colors shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center text-[#1a1a1a]">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a] text-center">Custom Meal</span>
                </Link>

                <Link
                  href="/workout/active"
                  onClick={onClose}
                  className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-[#1a1a1a]/5 hover:border-[#ff4500]/30 hover:bg-[#ff4500]/5 transition-colors shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center text-[#1a1a1a]">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a] text-center">Workout</span>
                </Link>
              </div>

              <div className="pt-6 pb-2">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white rounded-2xl border border-[#1a1a1a]/10 font-bold text-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
