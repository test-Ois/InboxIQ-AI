'use client';

import Link from 'next/link';
import { 
  Mail, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  KeyRound, 
  CalendarDays, 
  Terminal, 
  User, 
  FileText, 
  CheckCircle2,
  Lock,
  Layers,
  Activity,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-[#050816] text-[#fafafa] overflow-x-hidden font-sans">
      {/* Techy Grid Background */}
      <div className="absolute inset-0 grid-background grid-mask z-0 opacity-55 pointer-events-none" />
      
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-[5%] left-[5%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-violet-900/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-indigo-900/10 blur-[140px] pointer-events-none z-0" />

      {/* Header Navigation */}
      <header className="w-full max-w-7xl px-6 py-5 flex items-center justify-between z-10 border-b border-white/[0.03] bg-[#050816]/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9.5 h-9.5 rounded-xl bg-violet-600 shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-violet-500/20">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            InboxIQ AI
          </span>
        </div>
        
        <Link 
          href="/login"
          className="px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase border border-white/5 bg-[#0B1020]/40 backdrop-blur-md hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-400 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300 cursor-pointer"
        >
          Sign In
        </Link>
      </header>

      {/* Hero & Intro Section */}
      <main className="w-full max-w-7xl px-6 pt-16 pb-24 flex flex-col items-center text-center gap-10 z-10 flex-grow">
        
        {/* Subtle pill tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(124,58,237,0.1)]"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Enterprise-Grade Email Sync Engine
        </motion.div>

        {/* Dynamic Header */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight max-w-4xl leading-[1.12] bg-gradient-to-b from-white via-zinc-200 to-zinc-550 bg-clip-text text-transparent font-sans"
        >
          Intelligence Infrastructure For Your Email Workspace
        </motion.h1>

        {/* Short copy description */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed font-sans font-medium"
        >
          Securely link your workspace using OAuth. Index email metadata asynchronously via background queue workers, detect security threats, and stream instant AI response drafts.
        </motion.p>

        {/* Hero CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold tracking-wide shadow-[0_4px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_35px_rgba(124,58,237,0.5)] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
          >
            Launch Platform Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Dashboard Preview Mockup Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.4 }}
          className="w-full max-w-5xl mt-12 rounded-3xl border border-white/5 bg-[#0B1020]/20 p-2 md:p-3 backdrop-blur-md shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Top light glow reflection overlay */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          
          {/* Browser-like window wrapper */}
          <div className="rounded-2xl bg-[#050816]/75 border border-white/5 overflow-hidden flex flex-col text-left font-sans">
            {/* Window title bar */}
            <div className="px-4 py-3 bg-[#0B1020]/65 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/20" />
                <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/20" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/20" />
              </div>
              <div className="flex items-center gap-2 bg-[#050816]/80 px-4 py-1.5 rounded-xl border border-white/5 text-[10px] text-zinc-500 font-mono w-64 justify-center">
                <span className="opacity-40">https://</span>app.inboxiq.ai/dashboard
              </div>
              <div className="w-10" />
            </div>

            {/* Content Mock layout */}
            <div className="grid grid-cols-12 md:h-[450px]">
              {/* Mock Sidebar */}
              <div className="col-span-3 border-r border-white/5 bg-zinc-950/20 p-4 space-y-5 hidden md:block">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black text-[10px]">I</div>
                  <span className="font-extrabold text-xs text-zinc-200">InboxIQ AI</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold">
                    <Activity className="w-3.5 h-3.5" /> Dashboard
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-zinc-500 text-[10px] font-bold hover:text-zinc-300 transition-colors">
                    <Mail className="w-3.5 h-3.5" /> Email Inbox
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-zinc-500 text-[10px] font-bold hover:text-zinc-300 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5" /> Threat Detection
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 text-zinc-500 text-[10px] font-bold hover:text-zinc-300 transition-colors">
                    <Bot className="w-3.5 h-3.5" /> AI Playground
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Feed */}
              <div className="col-span-12 md:col-span-9 p-6 space-y-6 bg-zinc-950/10 overflow-y-auto no-scrollbar">
                
                {/* Greeting banner */}
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.03]">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-zinc-150">Welcome, Developer</h3>
                    <p className="text-[10px] text-zinc-500">System scan: 100% operational. Database connection active.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B1020] border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-violet-400 uppercase font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Active Sync
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#0B1020]/30 space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Scan Count</span>
                    <span className="text-xl font-black text-zinc-200">14,285</span>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-[#0B1020]/30 space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Security Index</span>
                    <span className="text-xl font-black text-emerald-400">98/100</span>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-[#0B1020]/30 space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block">Open Tasks</span>
                    <span className="text-xl font-black text-violet-400">12 Extracted</span>
                  </div>
                </div>

                {/* Feed simulation list */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">AI Intelligence Live Stream</h4>
                  
                  {/* Item 1 */}
                  <div className="p-3.5 rounded-xl border border-white/5 bg-violet-500/[0.01] hover:bg-violet-500/[0.03] transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">Critical</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-zinc-300">Authorize API Maintenance Access</p>
                        <p className="text-[9px] text-zinc-550 truncate max-w-[300px] font-mono">From: admin@inboxiq.ai - "Verify access keys for migrations..."</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">2 mins ago</span>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3.5 rounded-xl border border-white/5 bg-[#0B1020]/25 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">High</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-zinc-300">Google Workspace Sync Complete</p>
                        <p className="text-[9px] text-zinc-550 truncate max-w-[300px] font-mono">From: System Worker - "Folder sync successfully terminated..."</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">10 mins ago</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Bento Showcase Section */}
        <div className="mt-28 w-full space-y-6 text-left">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Built For Enterprise Security & Performance
            </h2>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest font-mono">
              Designed for modern cloud infrastructure
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Bento Card 1: Double Columns */}
            <motion.div 
              variants={itemVariants} 
              className="glass-panel p-8 rounded-2xl flex flex-col gap-6 md:col-span-2 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-350"
            >
              {/* Background gradient grid */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-widest font-mono">Feature Module</span>
              </div>
              
              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-bold text-zinc-150 group-hover:text-white transition-colors">AI priority & Intelligence Engine</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Deeply integrates with Gemini models to analyze incoming mail payloads. It extracts action-items, assigns priorities (Critical to Low), logs confidence scores, and determines deadlines automatically.
                </p>
              </div>

              {/* Custom Mini Widget Inside Card */}
              <div className="p-4 rounded-xl border border-white/5 bg-[#050816]/70 space-y-2.5 font-mono text-[10px] relative z-10">
                <div className="flex justify-between items-center text-[9px] text-zinc-550 border-b border-white/[0.03] pb-1.5">
                  <span>METADATA ANALYZER</span>
                  <span className="text-violet-400">GEMINI-FLASH ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category:</span>
                  <span className="text-zinc-350 font-bold">INFRASTRUCTURE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Priority Score:</span>
                  <span className="text-rose-450 font-bold">CRITICAL (94/100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Summary:</span>
                  <span className="text-zinc-400 font-sans italic text-right max-w-[280px] truncate">"Require user verification for server token keys rotation."</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2: Single Column */}
            <motion.div 
              variants={itemVariants} 
              className="glass-panel p-8 rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-350"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent pointer-events-none" />
              
              <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-white transition-colors">Real-Time Threat Hunting</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-sans">
                  Automatically flags spam, phishing domains, spoofed headers, and business email compromise (BEC) attempts to keep your team safe.
                </p>
              </div>

              {/* Threat Alert Alerting UI */}
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                <div className="text-left font-sans">
                  <p className="text-[10px] font-bold text-rose-450 uppercase">BEC Phishing Domain</p>
                  <p className="text-[8px] text-zinc-500 font-mono">Source: verification-invoice-service.net</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 3: Single Column */}
            <motion.div 
              variants={itemVariants} 
              className="glass-panel p-8 rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-350"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none" />
              
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
                <CalendarDays className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-white transition-colors">Calendar & Meeting Match</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-sans">
                  Find schedule overlaps, detect busy-hour calendar conflicts, and review auto-generated ranked availability slots.
                </p>
              </div>

              {/* Calendar Suggestion UI */}
              <div className="p-3 rounded-xl border border-white/5 bg-[#050816]/80 flex items-center justify-between text-[9px] font-mono">
                <span className="text-zinc-550">Rank #1 Available:</span>
                <span className="text-emerald-400 font-bold">14:00 - 14:30 UTC</span>
              </div>
            </motion.div>

            {/* Bento Card 4: Double Columns */}
            <motion.div 
              variants={itemVariants} 
              className="glass-panel p-8 rounded-2xl flex flex-col gap-6 md:col-span-2 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-350"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-widest font-mono">Queue Pipeline</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-150 group-hover:text-white transition-colors">BullMQ Asynchronous Background Workers</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Decouple resource-intensive synchronization steps. The engine handles folder pagination, history ID increments, and token updates without locking up user-facing dashboard actions.
                </p>
              </div>

              {/* Techy pipeline logs */}
              <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/70 font-mono text-[9px] text-zinc-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-violet-400" /> [job-id: sync-827]</span>
                  <span className="text-emerald-400 font-bold">SUCCESS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-zinc-600" /> [job-id: gemini-analysis-55]</span>
                  <span className="text-violet-400 font-bold animate-pulse">RUNNING</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-zinc-700" /> [job-id: calendar-conflict-92]</span>
                  <span className="text-zinc-650">QUEUED</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 5: Single Column */}
            <motion.div 
              variants={itemVariants} 
              className="glass-panel p-8 rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-350"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
              
              <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-brand group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-150 group-hover:text-white transition-colors">AES-256-GCM Secure Rest</h3>
                <p className="text-xs text-zinc-450 leading-relaxed font-sans">
                  Workspace access tokens are encrypted using authenticated GCM payloads. Credentials never expose their details to client-side codebases.
                </p>
              </div>

              {/* Encryption UI badge */}
              <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 flex items-center gap-2 text-[9px] font-mono text-emerald-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>SECURED AES-REST PAYLOAD</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Redesigned & Centered Premium Landing Footer */}
      <footer className="w-full border-t border-white/[0.04] bg-[#0B1020]/25 backdrop-blur-md py-16 mt-auto z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
          {/* Main Footer Links Columns (Centered) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-left md:text-center">
            
            {/* Column 1: Navigate */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Navigate</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/dashboard" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Dashboard</Link>
                </li>
                <li>
                  <Link href="/inbox" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Email Inbox</Link>
                </li>
                <li>
                  <Link href="/copilot" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">AI Copilot</Link>
                </li>
                <li>
                  <Link href="/tasks" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Action Tasks</Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Intelligence */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Intelligence</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/security" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Threat Risk</Link>
                </li>
                <li>
                  <Link href="/cleanup" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Hygiene Sweep</Link>
                </li>
                <li>
                  <Link href="/calendar" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Calendar Match</Link>
                </li>
                <li>
                  <Link href="/settings" className="text-zinc-550 hover:text-zinc-300 transition-colors font-medium">Configuration</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Architecture</h4>
              <ul className="space-y-2 text-xs font-medium text-zinc-550">
                <li className="hover:text-zinc-450 transition-colors cursor-default">Next.js Framework</li>
                <li className="hover:text-zinc-450 transition-colors cursor-default">BullMQ Queue</li>
                <li className="hover:text-zinc-450 transition-colors cursor-default">Gemini-Flash API</li>
                <li className="hover:text-zinc-450 transition-colors cursor-default">AES Encryption</li>
              </ul>
            </div>

            {/* Column 4: Developer */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Developer</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <span className="text-zinc-550 font-medium">Qayoom Akhtar</span>
                </li>
                <li className="text-[10px] text-zinc-650 font-bold uppercase tracking-wide">
                  SaaS Phase 1 Foundation
                </li>
                <li>
                  <span className="text-zinc-550 font-mono">v1.0 MVP API</span>
                </li>
              </ul>
            </div>
            
          </div>

          {/* Divider line */}
          <div className="max-w-4xl mx-auto h-[1px] bg-white/[0.03]" />

          {/* Bottom Copyright & Credit info (Centered) */}
          <div className="space-y-3 font-sans">
            <p className="text-xs text-zinc-550 font-semibold tracking-wide">
              &copy; {new Date().getFullYear()} InboxIQ AI. Production SaaS Architecture Foundation (Phase 1).
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Developed by <span className="text-zinc-350 hover:text-violet-400 transition-colors duration-200 cursor-pointer">Qayoom Akhtar</span>
            </p>
            <p className="text-[9px] text-zinc-600 font-mono">
              React 19 &bull; Tailwind CSS 4 &bull; Framer Motion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
