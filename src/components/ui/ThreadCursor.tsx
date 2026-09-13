'use client';

import { useEffect, useRef, useState } from 'react';

// How many points to keep in the trail buffer
const TRAIL_LENGTH = 20;

export default function ThreadCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track mouse position
  const mouse = useRef({ x: 0, y: 0 });
  const previousMouse = useRef({ x: 0, y: 0 });
  const trail = useRef(Array(TRAIL_LENGTH).fill({ x: 0, y: 0 }));
  const requestRef = useRef<number | null>(null);
  
  const [isMobile, setIsMobile] = useState(true); // Default to true for SSR safety
  
  useEffect(() => {
    // Check if device is mobile (coarse pointer)
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsMobile(true);
      return;
    }
    setIsMobile(false);
    
    // Set initial canvas size
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Track mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Main animation loop
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (!canvas || !ctx) {
        requestRef.current = requestAnimationFrame(render);
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update trail logic:
      // We push the current mouse position to the head of the array and pop the tail
      // But we smooth it out so it doesn't jump instantly
      
      // Interpolate the head of the trail slightly towards the mouse
      const newHead = {
        x: previousMouse.current.x + (mouse.current.x - previousMouse.current.x) * 0.5,
        y: previousMouse.current.y + (mouse.current.y - previousMouse.current.y) * 0.5
      };
      
      previousMouse.current = newHead;
      
      const currentTrail = [...trail.current];
      currentTrail.unshift(newHead);
      currentTrail.pop();
      trail.current = currentTrail;
      
      // Draw bezier curve through the points
      ctx.beginPath();
      
      if (currentTrail.length > 0) {
        ctx.moveTo(currentTrail[0].x, currentTrail[0].y);
        
        for (let i = 1; i < currentTrail.length - 2; i++) {
          const xc = (currentTrail[i].x + currentTrail[i + 1].x) / 2;
          const yc = (currentTrail[i].y + currentTrail[i + 1].y) / 2;
          ctx.quadraticCurveTo(currentTrail[i].x, currentTrail[i].y, xc, yc);
        }
        
        // Connect last two points
        if (currentTrail.length > 2) {
          ctx.quadraticCurveTo(
            currentTrail[currentTrail.length - 2].x,
            currentTrail[currentTrail.length - 2].y,
            currentTrail[currentTrail.length - 1].x,
            currentTrail[currentTrail.length - 1].y
          );
        }
      }
      
      // Create a gradient that fades out along the stroke
      // We can simulate this by drawing multiple overlapping strokes with decreasing width/opacity,
      // but a simpler high-perf way is a solid color and we rely on the line cap/join + 
      // a slight shadow for the "glow"
      
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.8)'; // #ff4500 with opacity
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Loop
      requestRef.current = requestAnimationFrame(render);
    };
    
    requestRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (isMobile) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'normal' }} // Nexusmag uses a standard top-layer ribbon, no difference blend
    />
  );
}
