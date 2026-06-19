'use client';

import { signIn } from 'next-auth/react';
import { Mail } from 'lucide-react';
import React, { useState } from 'react';

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
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] overflow-hidden px-4">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl flex flex-col items-center gap-8 relative z-10 animate-fade-in-up">
        
        {/* Brand logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome to InboxIQ AI</h2>
          <p className="text-zinc-400 text-sm text-center">
            Sign in to start synchronizing and indexing your emails securely.
          </p>
        </div>

        {/* OAuth Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-100 font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.54 0-6.409-2.87-6.409-6.409s2.87-6.409 6.41-6.409c1.542 0 2.943.543 4.051 1.486L21.1 4.148C18.826 2.086 15.79 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.866-4.254 10.866-11.24 0-.668-.076-1.32-.218-1.955H12.24z"
              />
            </svg>
          )}
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-zinc-500 text-center leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy. All email data is synced asynchronously and stored with AES encryption.
        </p>

      </div>
    </div>
  );
}
