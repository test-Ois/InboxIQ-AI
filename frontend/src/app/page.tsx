import Link from 'next/link';
import { Mail, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-[#09090b]">
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-900/20 blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            InboxIQ AI
          </span>
        </div>
        <Link 
          href="/login"
          className="px-5 py-2 rounded-xl text-sm font-semibold border border-zinc-800 hover:bg-zinc-900 transition-all duration-200"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl px-6 py-16 flex flex-col items-center text-center gap-8 z-10 flex-grow justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide animate-fade-in-up">
          <ShieldCheck className="w-3.5 h-3.5" />
          Enterprise-Grade Email Sync Engine
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15] bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
          Intelligence Infrastructure For Your Inbox
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          Securely link your workspace, index Gmail metadata asynchronously using BullMQ background workers, and prepare your data for downstream AI insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-[0_4px_20px_rgba(79,70,229,0.35)] transition-all duration-300 transform hover:scale-[1.02]"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400 border border-zinc-800">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Separated OAuth Sync</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Login securely using Google OAuth and separately connect specific Gmail inbox accounts with read-only permissions.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400 border border-zinc-800">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">BullMQ Async Workers</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Decouple API loads. Queued operations sync folders, process tokens, and track history IDs without blocking UI execution.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400 border border-zinc-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">AES-256-GCM Encryption</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your credentials are encrypted at-rest using authenticated GCM payloads. Sensitive secrets never reach the browser client.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-zinc-900 text-center text-xs text-zinc-600 z-10">
        &copy; {new Date().getFullYear()} InboxIQ AI. Production SaaS Architecture Foundation (Phase 1).
      </footer>
    </div>
  );
}
