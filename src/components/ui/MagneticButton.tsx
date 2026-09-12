'use client';

import React, { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MagneticButtonProps extends Omit<HTMLMotionProps<"button">, "onAnimationStart"> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}

export function MagneticButton({ children, variant = 'primary', className = '', ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Magnetic pull strength (lower is weaker)
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseClasses = "relative px-8 py-4 font-medium rounded-full transition-colors overflow-hidden flex items-center justify-center gap-2";
  
  let variantClasses = "";
  if (variant === 'primary') {
    variantClasses = "bg-[#1a1a1a] text-white hover:bg-[#ff4500] border border-[#1a1a1a] hover:border-[#ff4500] shadow-sm hover:shadow-lg hover:shadow-orange-500/20";
  } else if (variant === 'outline') {
    variantClasses = "bg-transparent text-[#1a1a1a] border border-[#1a1a1a]/20 hover:border-[#ff4500] hover:text-[#ff4500]";
  } else if (variant === 'ghost') {
    variantClasses = "bg-transparent text-[#1a1a1a] hover:bg-black/5";
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...(props as any)}
    >
      <motion.span 
        animate={{ x: position.x * 0.4, y: position.y * 0.4 }} 
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 flex items-center justify-center gap-2"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
