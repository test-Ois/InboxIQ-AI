'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Inbox, Settings, LogOut, Menu, X, Mail, CheckSquare, ShieldAlert, Sparkles, Bot, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Security', href: '/security', icon: ShieldAlert },
    { name: 'Cleanup', href: '/cleanup', icon: Sparkles },
    { name: 'AI Copilot', href: '/copilot', icon: Bot },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-gradient-to-b from-card/90 via-card/55 to-background/98 backdrop-blur-xl shrink-0">
        {/* Brand logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border/30">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand shadow-[0_0_20px_rgba(124,58,237,0.25)] border border-brand/20">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            InboxIQ AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative group',
                  isActive
                    ? 'text-white bg-brand/10 border border-brand/20 shadow-[inset_0_0_12px_rgba(124,58,237,0.12)] glow-brand'
                    : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent'
                )}
              >
                <Icon className={cn('w-4.5 h-4.5 transition-colors duration-300', isActive ? 'text-brand' : 'text-zinc-500 group-hover:text-zinc-300')} />
                {item.name}
                {isActive && (
                  <motion.div
                     layoutId="activeGlow"
                     className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                     transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile info */}
        {session?.user && (
          <div className="p-4 border-t border-border/30 bg-zinc-950/30 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-hover p-[1px] shadow-[0_0_12px_rgba(124,58,237,0.12)]">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-xs font-bold text-brand uppercase select-none">
                  {session.user.name?.slice(0, 2) || session.user.email?.slice(0, 2)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-200 truncate">{session.user.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border border-border bg-zinc-950/20 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* 2. Mobile Nav top bar */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl md:hidden shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand shadow-[0_0_15px_rgba(124,58,237,0.25)]">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-250">InboxIQ AI</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-zinc-250 cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile drawer backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile drawer panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-64 border-r border-border bg-card/95 backdrop-blur-xl z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-brand" />
                  <span className="font-bold text-zinc-250">InboxIQ AI</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-350 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150',
                        isActive
                          ? 'bg-brand/10 border border-brand/20 text-white shadow-[inset_0_0_12px_rgba(124,58,237,0.12)] glow-brand'
                          : 'text-zinc-455 hover:bg-zinc-900/50 hover:text-zinc-200'
                      )}
                    >
                      <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-brand' : 'text-zinc-500')} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {session?.user && (
                <div className="p-4 border-t border-border/30 bg-zinc-950/20 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-brand to-brand-hover p-[1px]">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-xs font-bold text-brand uppercase">
                        {session.user.name?.slice(0, 2) || session.user.email?.slice(0, 2)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{session.user.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border border-border text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 3. Main Content Panel & Sticky Footer Layout */}
        <main className="flex-1 overflow-y-auto relative focus:outline-none no-scrollbar flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>

          {/* Premium Overhauled Footer */}
          <footer className="w-full border-t border-border/20 bg-card/45 backdrop-blur-md mt-12 py-10 z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-8">
              
              {/* Upper Section */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/20">
                {/* Left side brand info */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-brand/10 border border-brand/20 shadow-[0_0_15px_rgba(124,58,237,0.12)]">
                      <Mail className="w-4.5 h-4.5 text-brand" />
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-tight">InboxIQ AI</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium tracking-wide">
                    AI-Powered Email Intelligence Platform
                  </p>
                </div>

                {/* Center quick links */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {navItems.slice(0, 7).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-xs text-zinc-400 hover:text-brand font-semibold tracking-wide transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Right Badge */}
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold bg-brand/10 border border-brand/20 text-brand uppercase tracking-wider glow-brand">
                    v1.0 MVP
                  </span>
                </div>
              </div>

              {/* Bottom Copyright and Credit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs">
                <p className="text-zinc-500 font-medium">
                  &copy; {new Date().getFullYear()} InboxIQ AI. All Rights Reserved.
                </p>

                <p className="text-zinc-500 font-medium">
                  Developed by <span className="text-zinc-350 font-bold hover:text-brand transition-colors duration-200">Qayoom Akhtar</span>
                </p>
              </div>

            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
