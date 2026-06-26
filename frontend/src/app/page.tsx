/**
 * page.tsx
 * Premium landing page for InboxIQ AI.
 * Design inspired by Game Galaxy Hub — bold gradient hero, strong typography,
 * clean dark background, clear visual hierarchy.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-[#050810] text-white overflow-x-hidden font-sans antialiased">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-[#050810]/85 backdrop-blur-xl border-b border-white/8 py-4 shadow-lg shadow-black/30'
        : 'bg-transparent py-5'
        }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6d28d9] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-700/30 group-hover:shadow-purple-600/50 transition-all duration-300 group-hover:scale-105">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-purple-200 transition-colors duration-200">
              InboxIQ <span className="text-[#a78bfa]">AI</span>
            </span>
          </Link>

          {/* Nav Links — premium underline hover effect */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Security', href: '#security' },
              { label: 'Workspace', href: '#workspace' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative text-[13px] font-semibold text-zinc-200 hover:text-white transition-colors duration-200 group/nav py-1"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#a78bfa] to-[#6d28d9] group-hover/nav:w-full transition-all duration-300 ease-out rounded-full" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-zinc-200 hover:text-white transition-colors bg-black hover:bg-purple-800 duration-200 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-[13px] font-bold bg-[#6d28d9] hover:bg-[#7c3aed] text-white tracking-wide transition-all duration-200 cursor-pointer shadow-lg shadow-purple-900/40 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-700/40 active:scale-95"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-white/15 bg-white/8 text-zinc-200 cursor-pointer hover:bg-white/12 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#080b18] border-b border-white/8 px-6 py-5 flex flex-col gap-4"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-200 hover:text-white hover:pl-1 transition-all duration-200">Features</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-200 hover:text-white hover:pl-1 transition-all duration-200">Security</a>
              <a href="#workspace" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-200 hover:text-white hover:pl-1 transition-all duration-200">Workspace</a>
              <hr className="border-white/8" />
              <div className="flex items-center justify-between">
                <Link href="/login" className="text-sm font-semibold text-zinc-200 hover:text-white transition-colors">Sign In</Link>
                <Link href="/login" className="px-5 py-2 rounded-full text-xs font-bold bg-[#6d28d9] text-white shadow-lg shadow-purple-900/40">Get Started →</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <main className="w-full max-w-6xl px-6 pt-32 sm:pt-36 z-10 relative">

        {/* Hero Banner Card — vivid gradient like Game Galaxy Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #2d0a6e 30%, #4c1d95 60%, #5b21b6 80%, #6d28d9 100%)',
          }}
        >
          {/* Subtle noise overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 70% 40%, rgba(139,92,246,0.4) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(91,33,182,0.3) 0%, transparent 50%)`
          }} />

          <div className="relative z-10 px-10 py-14 sm:px-16 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-10">

            {/* Text block */}
            <div className="space-y-5 text-left max-w-lg">
              {/* Label badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white/80 uppercase tracking-widest backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                AI-Powered Email Intelligence
              </div>

              {/* Big headline */}
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">
                EMAIL<br />
                <span style={{ color: '#c4b5fd' }}>INTELLIGENCE</span><br />
                BUILT FOR YOU.
              </h1>

              {/* Subtitle */}
              <p className="text-sm text-white/70 leading-relaxed max-w-sm font-medium">
                Let AI prioritize, summarize, and protect your inbox — so you can focus on what matters.
              </p>
            </div>

            {/* CTA Block */}
            <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-sm text-black tracking-wide transition-all duration-200 cursor-pointer active:scale-95 shadow-xl shadow-yellow-400/20"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                <Sparkles className="w-4 h-4" />
                Connect Workspace
              </Link>
              <p className="text-[10px] text-white/40 font-medium tracking-wide">No credit card required</p>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Row ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          {[
            { label: 'Emails Analysed', value: '10M+' },
            { label: 'Threats Detected', value: '99.8%' },
            { label: 'Time Saved / Day', value: '2.4h' },
            { label: 'AI Drafts Written', value: '5M+' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl px-5 py-5 text-left border border-white/5"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <p className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1 font-mono">{stat.label}</p>
            </div>
          ))}
        </motion.div>

      </main>

      {/* ── Feature Cards Section ───────────────────────────────────────────── */}
      <section id="features" className="w-full max-w-6xl px-6 mt-20 sm:mt-28 z-10 relative">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 space-y-2"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary font-mono">✦ Core Features</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Your inbox, supercharged.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl p-7 flex flex-col justify-between min-h-[220px] border border-white/5 relative overflow-hidden group cursor-default hover:border-primary/30 transition-all duration-300"
            style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #0d0d1f 100%)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all" />
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white mb-2">AI Email Intelligence</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Understand your inbox faster. AI summarizes, categorizes, and drafts responses in seconds.</p>
            </div>
            <Link href="/login" className="mt-5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary hover:text-white transition-colors">
              Launch Copilot <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl p-7 flex flex-col justify-between min-h-[220px] border border-white/5 relative overflow-hidden group cursor-default hover:border-red-pink/30 transition-all duration-300"
            style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #0d0d1f 100%)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-pink/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-pink/15 transition-all" />
            <div className="w-10 h-10 rounded-xl bg-red-pink/15 border border-red-pink/20 flex items-center justify-center mb-5">
              <ShieldCheck className="w-5 h-5 text-red-pink" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white mb-2">Enterprise Security</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Catch suspicious emails before they reach you. Deep SPF, DKIM, and BEC domain validation.</p>
            </div>
            <Link href="/login" className="mt-5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-red-pink hover:text-white transition-colors">
              View Threat Radar <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl p-7 flex flex-col justify-between min-h-[220px] border border-white/5 relative overflow-hidden group cursor-default hover:border-coral/30 transition-all duration-300"
            style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #0d0d1f 100%)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-3xl pointer-events-none group-hover:bg-coral/15 transition-all" />
            <div className="w-10 h-10 rounded-xl bg-coral/15 border border-coral/20 flex items-center justify-center mb-5">
              <CalendarDays className="w-5 h-5 text-coral" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white mb-2">Smart Automation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">Automate your workspace. Sync your calendar and auto-generate task checklists from email context.</p>
            </div>
            <Link href="/login" className="mt-5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-coral hover:text-white transition-colors">
              Explore Workspace <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ── CTA Banner Section ──────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl px-6 mt-16 sm:mt-24 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden px-10 py-14 sm:px-16 text-left flex flex-col sm:flex-row items-center justify-between gap-8"
          style={{ background: 'linear-gradient(135deg, #1e0050 0%, #3b0764 40%, #5b21b6 100%)' }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, rgba(196,181,253,0.3) 0%, transparent 60%)`
          }} />
          <div className="relative z-10 space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50 font-mono">Ready to focus?</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Connect your inbox today.</h2>
            <p className="text-sm text-white/60 max-w-md leading-relaxed font-medium">Experience email intelligence built for modern teams. Secure, fast, and minimal.</p>
          </div>
          <div className="relative z-10 shrink-0">
            <Link
              href="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-sm text-black tracking-wide transition-all duration-200 cursor-pointer active:scale-95 shadow-xl shadow-yellow-400/20"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-white/8 py-16 mt-20 z-10" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-12">

          {/* Top — logo + tagline + columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

            {/* Brand col */}
            <div className="md:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6d28d9] to-[#a855f7] flex items-center justify-center shadow-md shadow-purple-700/30">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-white">
                  InboxIQ <span className="text-[#a78bfa]">AI</span>
                </span>
              </Link>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs font-medium">
                AI-powered email intelligence for modern professionals. Prioritize, protect, and automate your inbox.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">Built by Qayoom Akhtar</p>
            </div>

            {/* Link columns */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {[
                {
                  label: 'Product',
                  links: [
                    { text: 'Dashboard', href: '/login' },
                    { text: 'Inbox Stream', href: '/login' },
                    { text: 'Threat Radar', href: '/login' },
                    { text: 'AI Copilot', href: '/login' },
                  ]
                },
                {
                  label: 'Company',
                  links: [
                    { text: 'About Us', href: '#' },
                    { text: 'Security', href: '#' },
                    { text: 'Help Center', href: '#' },
                  ]
                },
                {
                  label: 'Legal',
                  links: [
                    { text: 'Privacy Policy', href: '#' },
                    { text: 'Terms of Use', href: '#' },
                  ]
                },
              ].map((col) => (
                <div key={col.label} className="space-y-4">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70 font-mono">
                    {col.label}
                  </h4>
                  <ul className="space-y-3">
                    {col.links.map((link) => (
                      <li key={link.text}>
                        <Link
                          href={link.href}
                          className="group/fl flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white transition-all duration-200 font-medium cursor-pointer"
                        >
                          <span className="w-0 group-hover/fl:w-3 overflow-hidden transition-all duration-200 text-[#a78bfa] text-[10px] font-bold">›</span>
                          <span className="group-hover/fl:translate-x-0.5 transition-transform duration-200">{link.text}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] font-medium text-zinc-400">
              &copy; 2026 InboxIQ AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {[
                { label: 'Privacy', href: '#' },
                { label: 'Terms', href: '#' },
                { label: 'GitHub', href: 'https://github.com' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="text-[12px] font-medium text-zinc-400 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
