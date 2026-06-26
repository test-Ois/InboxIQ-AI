/**
 * HeroGlow.tsx
 * Ambient, low-saturation atmospheric background glow system.
 * Re-themed to premium Sky Blue and Steel Gray, removing all purple.
 */

'use client';

import React from 'react';

export function HeroGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Style overrides for custom breathing keyframes */}
      <style jsx global>{`
        @keyframes breathe-slow-violet {
          0%, 100% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.7; }
          50% { transform: translate(-48%, -52%) scale(1.12); opacity: 0.9; }
        }
        @keyframes breathe-slow-steel {
          0%, 100% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.75; }
          50% { transform: translate(-52%, -48%) scale(1.08); opacity: 0.95; }
        }
        @keyframes breathe-slow-purple {
          0%, 100% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
        }
      `}</style>

      {/* Glow Center Wrapper - Centered around the hero typography section */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[800px] opacity-70">
        
        {/* Layer 1: Deep Violet Ambient base (shifted left-center) */}
        <div 
          className="absolute left-[38%] top-[45%] w-[400px] md:w-[680px] h-[400px] md:h-[680px] rounded-full bg-[#7c3aed]/4 blur-[140px]"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'breathe-slow-violet 20s ease-in-out infinite',
          }}
        />

        {/* Layer 2: Steel Gray Core (centered) */}
        <div 
          className="absolute left-[50%] top-[48%] w-[320px] md:w-[550px] h-[320px] md:h-[550px] rounded-full bg-[#64748b]/3.5 blur-[120px]"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'breathe-slow-steel 16s ease-in-out infinite',
            animationDelay: '-3s',
          }}
        />

        {/* Layer 3: Electric Purple High-contrast underlay (shifted right-center) */}
        <div 
          className="absolute left-[62%] top-[42%] w-[380px] md:w-[620px] h-[380px] md:h-[620px] rounded-full bg-[#a855f7]/3 blur-[150px]"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'breathe-slow-purple 24s ease-in-out infinite',
            animationDelay: '-6s',
          }}
        />

        {/* Layer 4: Faint White Core for a subtle pearlescent sheen */}
        <div 
          className="absolute left-[50%] top-[46%] w-[200px] md:w-[350px] h-[200px] md:h-[350px] rounded-full bg-white/[0.01] blur-[80px]"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  );
}
export default HeroGlow;
