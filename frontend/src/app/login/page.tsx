'use client';

import { signIn } from 'next-auth/react';
import { Mail, ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ButtonLoader } from '@/components/ui';

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#050810] text-white overflow-hidden px-4 font-sans antialiased">

      {/* ── Ambient glow orbs ─────────────────────────────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)' }}
      />
      <div className="absolute top-[15%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-[15%] left-[15%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.04) 0%, transparent 70%)' }}
      />

      {/* ── Back link ─────────────────────────────────────────────────── */}
      <div className="absolute top-8 left-8 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back
        </Link>
      </div>

      {/* ── Login Card ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        className="relative z-10 w-full max-w-[400px] flex flex-col items-center"
      >

        {/* ── Logo block ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 14 }}
          className="mb-8 flex flex-col items-center gap-5"
        >
          {/* Icon */}
          <div className="relative">
            <div
              className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
                boxShadow: '0 20px 60px rgba(109,40,217,0.45), 0 0 0 1px rgba(167,139,250,0.15)',
              }}
            >
              <Mail className="w-8 h-8 text-white" strokeWidth={1.8} />
            </div>
            {/* Live dot */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-50" />
              <span
                className="relative inline-flex rounded-full h-4 w-4 border-2 border-[#050810]"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #6d28d9)' }}
              />
            </span>
          </div>

          {/* Wordmark */}
          <div className="text-center">
            <p className="text-[13px] font-bold tracking-[0.2em] uppercase text-zinc-400 font-mono mb-1">
              InboxIQ <span className="text-[#a78bfa]">AI</span>
            </p>
          </div>
        </motion.div>

        {/* ── Card surface ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full rounded-3xl p-8 flex flex-col items-center gap-7"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-12 right-12 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)' }}
          />

          {/* Headline */}
          <div className="text-center space-y-2.5">
            <h1 className="text-[26px] font-extrabold tracking-tight text-white leading-tight">
              Sign in to InboxIQ
            </h1>
            <p className="text-[13px] text-zinc-400 leading-relaxed font-medium max-w-[280px] mx-auto">
              Connect your Google account to unlock AI-powered email intelligence.
            </p>
          </div>

          {/* ── Google Button ──────────────────────────────────────── */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl font-bold text-[14px] tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[54px] group"
            style={{
              background: loading
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.35)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(109,40,217,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
            }}
          >
            <ButtonLoader show={loading}>
              {/* Google G Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
              </svg>
              <span>Continue with Google</span>
            </ButtonLoader>
          </button>

          {/* ── Privacy Reassurance ──────────────────────────────────── */}
          <div
            className="w-full rounded-2xl px-4 py-4 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a78bfa] font-mono">
                Your Privacy is Protected
              </span>
            </div>

            {[
              { icon: Eye, text: 'We never read or store the contents of your emails.' },
              { icon: Lock, text: 'No personal data is collected, retained, or sold.' },
              { icon: ShieldCheck, text: 'Your account is never modified — read-only access only.' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)' }}
                >
                  <Icon className="w-2.5 h-2.5 text-[#a78bfa]" />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{text}</p>
              </div>
            ))}
          </div>

          {/* ── Terms line ───────────────────────────────────────────── */}
          <p className="text-[11px] text-zinc-600 text-center leading-relaxed font-medium max-w-[280px]">
            By continuing, you agree to our{' '}
            <span className="text-zinc-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors duration-200">
              Terms of Service
            </span>{' '}and{' '}
            <span className="text-zinc-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors duration-200">
              Privacy Policy
            </span>.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
