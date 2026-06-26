'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery } from '@tanstack/react-query';
import { apiService, FraudAnalysisDto, FraudRiskLevel, FraudType } from '@/services/api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoader } from '@/components/ui';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Search,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Calendar,
  User,
  Globe,
  X,
  Server,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function SecurityPage() {
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<FraudRiskLevel | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<FraudType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Selected email for detail drawer
  const [selectedAnalysis, setSelectedAnalysis] = useState<FraudAnalysisDto | null>(null);

  // 1. Fetch Paginated Security Scans
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['fraud-analyses', page, search, riskFilter, typeFilter],
    queryFn: () =>
      apiService.getFraudAnalyses({
        page,
        limit,
        search: search || undefined,
        riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
        fraudType: typeFilter === 'ALL' ? undefined : typeFilter,
      }),
  });

  // 2. Fetch Aggregated Statistics & Score
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['fraud-stats'],
    queryFn: apiService.getFraudStats,
  });

  const getRiskColor = (level: FraudRiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-pink border-red-pink/30 bg-red-pink/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'HIGH':
        return 'text-coral border-coral/30 bg-coral/10 shadow-[0_0_12px_rgba(255,82,81,0.15)]';
      case 'MEDIUM':
        return 'text-coral border-coral/20 bg-coral/5';
      case 'LOW':
        return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
      case 'SAFE':
        return 'text-royal-blue border-royal-blue/30 bg-royal-blue/10 shadow-[0_0_12px_rgba(37,99,235,0.15)]';
      default:
        return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
    }
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: 'Secured Environment', color: 'text-royal-blue', glow: 'text-royal-blue/20', desc: 'No active threats detected. High domain integrity.' };
    if (score >= 75) return { label: 'Optimal Protection', color: 'text-primary', glow: 'text-primary/20', desc: 'Inbox shows high trust levels. Keep monitoring.' };
    if (score >= 50) return { label: 'Attention Required', color: 'text-coral', glow: 'text-coral/20', desc: 'Suspicious domain patterns or spam detected.' };
    return { label: 'Immediate Threat Alert', color: 'text-red-pink', glow: 'text-red-pink/20', desc: 'Critical risks identified. Verify sender identity immediately.' };
  };

  const totalPages = data?.meta?.totalPages || 1;
  const score = stats?.metrics?.securityScore ?? 100;
  const scoreStatus = getScoreStatus(score);

  // Framer Motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Top Header Section */}
        <div className="relative p-8 rounded-3xl overflow-hidden glass-panel border border-white/5 bg-gradient-to-br from-card/80 via-card/30 to-background">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-royal-blue/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 font-sans">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-royal-blue animate-pulse" />
                <span className="text-[10px] font-bold text-royal-blue uppercase tracking-widest bg-royal-blue/10 border border-royal-blue/20 px-2 py-0.5 rounded-full font-mono">
                  Real-time Scanners Active
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-primary/80 bg-clip-text text-transparent">
                Phishing & Threat Intelligence
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Protecting your workspace with real-time sender domain checks, malicious URL analysis, business email compromise (BEC) classifications, and automatic file hash inspections.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-800/80 font-mono">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Server className="w-5 h-5" />
              </div>
              <div className="pr-4 text-left">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">AI Engines</p>
                <p className="text-xs font-bold text-zinc-300">Gemini Dual-Fallbacks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Circular Security Dial Card */}
          <div className="glass-panel p-6.5 rounded-3xl border border-white/5 flex flex-col items-center justify-between min-h-[340px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="w-full flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest z-10 font-mono">
              <span>Security Rating</span>
              <Activity className="w-4 h-4 text-primary animate-pulse" />
            </div>

            <div className="relative flex items-center justify-center my-6 z-10">
              {/* Sleek gauge visualizer */}
              <svg className="w-40 h-40 transform -rotate-90">
                <defs>
                  <linearGradient id="securityScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={score >= 90 ? '#2563eb' : score >= 75 ? '#7c3aed' : score >= 50 ? '#ff5251' : '#f43f5e'} />
                    <stop offset="100%" stopColor={score >= 90 ? '#1d4ed8' : score >= 75 ? '#5b21b6' : score >= 50 ? '#dc2626' : '#be123c'} />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-zinc-950/80 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="fill-none transition-all duration-1000"
                  stroke="url(#securityScoreGrad)"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${score >= 90 ? '#2563eb' : score >= 75 ? '#7c3aed' : score >= 50 ? '#ff5251' : '#f43f5e'}90)` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center font-mono">
                <span className="text-4xl font-extrabold text-white tracking-tight">{score}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">Global Score</span>
              </div>
            </div>
 
            <div className="text-center z-10 space-y-1">
              <h3 className={`font-extrabold text-base tracking-tight ${score >= 90 ? 'text-royal-blue' : score >= 75 ? 'text-primary' : score >= 50 ? 'text-coral' : 'text-red-pink'}`}>{scoreStatus.label}</h3>
              <p className="text-xs text-zinc-555 max-w-xs leading-normal">{scoreStatus.desc}</p>
            </div>
          </div>

          {/* Quick Metrics Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-red-pink hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/80 to-card/20 shadow-md hover:shadow-red-pink/10">
              <div>
                <span className="text-[9px] font-bold text-red-pink uppercase tracking-wider bg-red-pink/10 border border-red-pink/20 px-2.5 py-1 rounded-full inline-block font-mono">
                  Critical
                </span>
                <span className="text-3xl font-extrabold text-zinc-100 mt-4 block tracking-tight text-gradient-rose font-mono">
                  {stats?.widgets?.criticalEmails ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-sans">Active malware/phishing threats detected</p>
            </div>
            
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-coral hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/80 to-card/20 shadow-md hover:shadow-coral/10">
              <div>
                <span className="text-[9px] font-bold text-coral uppercase tracking-wider bg-coral/10 border border-coral/20 px-2.5 py-1 rounded-full inline-block font-mono">
                  High Risk
                </span>
                <span className="text-3xl font-extrabold text-zinc-100 mt-4 block tracking-tight text-gradient-rose font-mono">
                  {stats?.widgets?.highRiskEmails ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-sans">Suspicious links & spoofing alerts</p>
            </div>
 
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-primary hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/80 to-card/20 shadow-md hover:shadow-primary/5">
              <div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full inline-block font-mono">
                  Total Scanned
                </span>
                <span className="text-3xl font-extrabold text-zinc-100 mt-4 block tracking-tight text-gradient-blue font-mono">
                  {stats?.metrics?.totalScanned ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-sans">Mailbox messages scanned by AI</p>
            </div>
 
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-royal-blue hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/80 to-card/20 shadow-md hover:shadow-royal-blue/10">
              <div>
                <span className="text-[9px] font-bold text-royal-blue uppercase tracking-wider bg-royal-blue/10 border border-royal-blue/20 px-2.5 py-1 rounded-full inline-block font-mono">
                  Trustworthy
                </span>
                <span className="text-3xl font-extrabold text-royal-blue mt-4 block tracking-tight text-gradient-blue font-mono">
                  {stats?.metrics?.safeEmailsCount ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-sans">Emails verified and rated fully safe</p>
            </div>
          </div>

          {/* Top Suspicious Domains Card */}
          <div className="glass-panel p-6.5 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[340px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest z-10 font-mono">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Suspicious Senders</span>
              </div>
              <span className="text-[10px] text-zinc-500">Flagged Domains</span>
            </div>

            <div className="flex-1 mt-5 space-y-3 overflow-y-auto no-scrollbar custom-scrollbar max-h-[210px] z-10 font-sans">
              {!stats?.widgets?.topSuspiciousDomains || stats.widgets.topSuspiciousDomains.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-500 italic py-10 gap-2 font-mono">
                  <ShieldCheck className="w-8 h-8 text-royal-blue/60" />
                  <span>No suspicious domains flagged.</span>
                </div>
              ) : (
                stats.widgets.topSuspiciousDomains.map((item, idx) => (
                  <div key={item.domain} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-zinc-950/40 border border-white/[0.03] hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 w-5 h-5 flex items-center justify-center rounded-lg font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-zinc-200 truncate">{item.domain}</span>
                    </div>
                    <span className="font-bold text-red-pink bg-red-pink/10 border border-red-pink/20 px-2 py-0.5 rounded-lg text-[10px] font-mono shadow-sm">
                      {item.count} warnings
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filter bar console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-555" />
            <input
              type="text"
              placeholder="Filter threat logs by sender, subject pattern, or assessment explanations..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#050816]/50 border border-zinc-800/80 focus:border-primary/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/30 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Risk filter */}
            <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium font-sans">Risk Level:</span>
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-semibold outline-none cursor-pointer border-none p-0 focus:ring-0"
              >
                <option value="ALL">All Levels</option>
                <option value="SAFE">Safe</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl text-xs">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium font-sans">Threat Vector:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-semibold outline-none cursor-pointer border-none p-0 focus:ring-0"
              >
                <option value="ALL">All Vectors</option>
                <option value="NONE">None (Safe)</option>
                <option value="PHISHING">Phishing</option>
                <option value="SPAM">Spam</option>
                <option value="SPOOFING">Spoofing</option>
                <option value="MALWARE">Malware</option>
                <option value="BEC">BEC (Compromise)</option>
                <option value="SCAM">Scam</option>
                <option value="IMPERSONATION">Impersonation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scanned Emails log list */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <PageLoader 
              text="Retrieving security logs" 
              subtitle="Fetching threat assessments and phishing markers..." 
              minHeight="min-h-[350px]"
            />
          ) : isError ? (
            <div className="glass-panel p-12 rounded-2xl border border-rose-500/20 text-center text-rose-450 font-medium font-mono text-xs">
              Failed to load security threat logs. Please refresh or check connection.
            </div>
          ) : !data?.analyses || data.analyses.length === 0 ? (
            <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center gap-5 relative overflow-hidden font-sans">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <div className="p-4 rounded-full bg-royal-blue/10 border border-royal-blue/25 text-royal-blue z-10 animate-pulse">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <div className="space-y-2 z-10">
                <p className="font-extrabold text-zinc-200 text-lg tracking-tight">Your Inbox is Secure</p>
                <p className="text-xs text-zinc-505 max-w-sm mx-auto leading-relaxed">
                  No threats found fitting current filter criteria. Incoming emails are scanned immediately upon synchronization.
                </p>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              {data.analyses.map((analysis) => (
                <motion.div
                  key={analysis.id}
                  variants={itemVariants}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-950/25 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 hover:border-zinc-800 shadow-md group"
                >
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border font-mono ${getRiskColor(analysis.riskLevel)}`}>
                        {analysis.riskLevel}
                      </span>
                      {analysis.fraudType !== 'NONE' && (
                        <span className="text-[9px] font-extrabold text-red-pink bg-red-pink/10 border border-red-pink/20 px-2 py-0.5 rounded-md uppercase tracking-widest font-mono">
                          {analysis.fraudType}
                        </span>
                      )}
                      <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-md font-mono font-bold">
                        {Math.round(analysis.confidenceScore * 100)}% Match
                      </span>
                    </div>
                    {analysis.email && (
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors truncate">
                          {analysis.email.subject}
                        </h4>
                        <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 truncate font-sans">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-300 font-semibold">{analysis.email.sender}</span>
                          <span className="text-zinc-500 font-mono">•</span>
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-mono text-[11px]">{new Date(analysis.email.receivedAt).toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5 text-primary bg-primary/5 group-hover:bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20 transition-all font-bold font-mono tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      Investigate
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-500 font-mono tracking-widest uppercase">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-555 hover:text-zinc-250 hover:bg-zinc-900/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Investigation details Drawer Overlay */}
      <AnimatePresence>
        {selectedAnalysis && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] bg-background/95 border-l border-white/5 backdrop-blur-xl z-50 p-6.5 shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-6">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-primary shadow-sm" />
                    <h2 className="font-extrabold text-zinc-100 text-base tracking-tight uppercase font-mono">Threat Assessment Report</h2>
                  </div>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Risk Level Gauge Area */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4.5 rounded-2xl border border-white/[0.03]">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Risk Level</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border font-mono ${getRiskColor(selectedAnalysis.riskLevel)}`}>
                      {selectedAnalysis.riskLevel}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Scanner Confidence</p>
                    <p className="text-2xl font-black text-white mt-1.5 font-mono">{Math.round(selectedAnalysis.confidenceScore * 100)}%</p>
                  </div>
                </div>

                {/* Email Metadata details */}
                {selectedAnalysis.email && (
                  <div className="p-4.5 rounded-2xl bg-zinc-950/40 border border-zinc-900/60 space-y-3.5 text-xs font-sans">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Sender Info</span>
                      <span className="font-semibold text-zinc-200 leading-normal break-all bg-zinc-950/50 p-2.5 border border-zinc-800/40 rounded-lg select-all font-mono">
                        {selectedAnalysis.email.sender}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Subject Line</span>
                      <span className="text-zinc-300 leading-normal bg-zinc-950/50 p-2.5 border border-zinc-800/40 rounded-lg font-bold">
                        {selectedAnalysis.email.subject}
                      </span>
                    </div>
                  </div>
                )}

                {/* Narrative Explanation */}
                <div className="space-y-2.5">
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    Security Assessment Explanation
                  </h3>
                  <div className="text-xs text-zinc-300 leading-relaxed bg-card/40 border border-white/5 p-4.5 rounded-2xl whitespace-pre-line font-sans shadow-inner">
                    {selectedAnalysis.explanation}
                  </div>
                </div>
                {/* Threats warning indices */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-pink" />
                    Flagged Threat Vectors
                  </h3>
 
                  <div className="space-y-2.5">
                    {!selectedAnalysis.indicators || selectedAnalysis.indicators.length === 0 ? (
                      <p className="text-xs text-zinc-550 italic p-4.5 border border-zinc-900 rounded-2xl bg-zinc-950/20 font-sans">
                        No secondary indicators flagged by the model.
                      </p>
                    ) : (
                      selectedAnalysis.indicators.map((indicator, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-red-pink/15 bg-red-pink/5 text-xs text-red-pink leading-relaxed font-sans shadow-sm">
                          <AlertTriangle className="w-4 h-4 text-red-pink/60 shrink-0 mt-0.5 animate-pulse" />
                          <span>{indicator}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="mt-8 pt-4.5 border-t border-zinc-900 flex justify-between items-center font-sans">
                <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-widest">
                  Model: {selectedAnalysis.modelName || 'Gemini'}
                </span>
                
                <a
                  href={`/inbox?search=${encodeURIComponent(selectedAnalysis.email?.sender || '')}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 font-mono"
                >
                  Go to Inbox
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}
