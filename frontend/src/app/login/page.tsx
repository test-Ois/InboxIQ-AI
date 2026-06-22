'use client';

import { signIn } from 'next-auth/react';
import { Mail, ShieldCheck, Sparkles, Activity, KeyRound, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { redirectTo: '/dashboard' });
    } catch (err) {
      console.error('Login redirection failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050816] text-[#fafafa] overflow-hidden px-4 font-sans">
      {/* Techy Grid Background */}
      <div className="absolute inset-0 grid-background grid-mask z-0 opacity-40 pointer-events-none" />

      {/* Decorative gradient glow lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[20%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-cyan-900/5 blur-[100px] pointer-events-none z-0" />

      {/* Back to landing page indicator */}
      <div className="absolute top-6 left-6 z-20">
        <a 
          href="/" 
          className="text-xs font-bold text-zinc-550 hover:text-zinc-300 transition-colors flex items-center gap-1.5 font-mono uppercase tracking-widest"
        >
          <span>&larr;</span> Back to Home
        </a>
      </div>

      {/* Floating Premium glass login card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 15 }}
        className="glass-panel w-full max-w-md p-8 md:p-10 rounded-3xl flex flex-col items-center gap-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        {/* Top Glow Accent line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        
        {/* Brand logo & pulsing status indicator */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-violet-600 shadow-[0_0_25px_rgba(124,58,237,0.45)] border border-violet-500/20">
              <Mail className="w-6 h-6 text-white" />
            </div>
            {/* Pulsing Status Dot */}
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <h2 className="text-2xl font-black tracking-tight text-zinc-150 font-sans">Welcome to InboxIQ AI</h2>
            <p className="text-zinc-450 text-xs font-medium max-w-xs leading-relaxed">
              Synchronize your workspace using Google OAuth and run background intelligence audits.
            </p>
          </div>
        </div>

        {/* Info badges banner */}
        <div className="w-full grid grid-cols-2 gap-3 text-[10px] font-mono text-zinc-450">
          <div className="p-3 rounded-xl border border-white/5 bg-[#050816]/60 flex flex-col gap-1">
            <span className="text-zinc-550 uppercase font-bold tracking-wider">Sync mode</span>
            <span className="text-violet-400 font-bold flex items-center gap-1"><Activity className="w-3 h-3 text-violet-400" /> Active BullMQ</span>
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-[#050816]/60 flex flex-col gap-1">
            <span className="text-zinc-550 uppercase font-bold tracking-wider">Security</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><KeyRound className="w-3 h-3 text-emerald-400" /> AES-256 GCM</span>
          </div>
        </div>

        {/* OAuth login button container */}
        <div className="w-full space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/5 bg-[#050816] hover:bg-violet-500/5 hover:border-violet-500/35 text-zinc-200 hover:text-violet-300 font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-[0_0_20px_rgba(124,58,237,0.12)]"
          >
            {loading ? (
              <div className="w-4.5 h-4.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.54 0-6.409-2.87-6.409-6.409s2.87-6.409 6.41-6.409c1.542 0 2.943.543 4.051 1.486L21.1 4.148C18.826 2.086 15.79 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.866-4.254 10.866-11.24 0-.668-.076-1.32-.218-1.955H12.24z"
                />
              </svg>
            )}
            {loading ? 'Redirection active...' : 'Continue with Google'}
          </button>
          
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-950/20 text-[9px] font-mono text-zinc-550 border border-white/[0.02]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Read-only sync permissions requested.</span>
          </div>
        </div>

        {/* Disclaimer / Agreement */}
        <p className="text-[10px] text-zinc-550 text-center leading-relaxed font-sans font-medium">
          By signing in, you authorize asynchronous API synchronizations. Sensitive secrets and credential tokens are stored with AES protection. Read our <span className="text-zinc-400 hover:text-violet-400 underline cursor-pointer">Security Policy</span>.
        </p>

      </motion.div>
    </div>
  );
}
