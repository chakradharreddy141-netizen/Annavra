'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function ThreadCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Configure multiple springs with slightly different stiffness to create a trailing effect
  const springConfig1 = { damping: 20, stiffness: 300, mass: 0.5 };
  const springConfig2 = { damping: 25, stiffness: 200, mass: 0.8 };
  const springConfig3 = { damping: 30, stiffness: 150, mass: 1.2 };
  const springConfig4 = { damping: 35, stiffness: 100, mass: 1.5 };

  const x1 = useSpring(0, springConfig1);
  const y1 = useSpring(0, springConfig1);
  const x2 = useSpring(0, springConfig2);
  const y2 = useSpring(0, springConfig2);
  const x3 = useSpring(0, springConfig3);
  const y3 = useSpring(0, springConfig3);
  const x4 = useSpring(0, springConfig4);
  const y4 = useSpring(0, springConfig4);

  useEffect(() => {
    x1.set(mousePosition.x);
    y1.set(mousePosition.y);
    x2.set(mousePosition.x);
    y2.set(mousePosition.y);
    x3.set(mousePosition.x);
    y3.set(mousePosition.y);
    x4.set(mousePosition.x);
    y4.set(mousePosition.y);
  }, [mousePosition, x1, y1, x2, y2, x3, y3, x4, y4]);

  // If on mobile (no hover support), don't render the cursor trail
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-orange-600 mix-blend-difference"
        style={{ x: x1, y: y1, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 mix-blend-difference"
        style={{ x: x2, y: y2, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="absolute w-1 h-1 rounded-full bg-orange-400 mix-blend-difference"
        style={{ x: x3, y: y3, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="absolute w-0.5 h-0.5 rounded-full bg-orange-300 mix-blend-difference"
        style={{ x: x4, y: y4, translateX: '-50%', translateY: '-50%' }}
      />
    </div>
  );
}
