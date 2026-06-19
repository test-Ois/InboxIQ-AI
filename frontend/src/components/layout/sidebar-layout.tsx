'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Inbox, Settings, LogOut, Menu, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/inbox', icon: Inbox },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-zinc-800 bg-[#0c0c0e] shrink-0">
        {/* Brand logo */}
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-zinc-900">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-200">InboxIQ AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile info */}
        {session?.user && (
          <div className="p-4 border-t border-zinc-900 bg-[#0c0c0e] flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-700/30 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase select-none">
                {session.user.name?.slice(0, 2) || session.user.email?.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">{session.user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* 2. Mobile Nav top bar */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0c0c0e] md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-zinc-200">InboxIQ AI</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile drawer backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile drawer panel */}
        <aside
          className={cn(
            'fixed top-0 bottom-0 left-0 w-64 border-r border-zinc-800 bg-[#0c0c0e] z-50 transform transition-transform duration-200 ease-in-out md:hidden flex flex-col',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-zinc-200">InboxIQ AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-900'
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {session?.user && (
            <div className="p-4 border-t border-zinc-900 bg-[#0c0c0e] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-400 uppercase">
                  {session.user.name?.slice(0, 2) || session.user.email?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{session.user.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
                Sign Out
              </button>
            </div>
          )}
        </aside>

        {/* 3. Main Content Panel */}
        <main className="flex-1 overflow-y-auto relative focus:outline-none no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
