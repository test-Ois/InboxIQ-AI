'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery } from '@tanstack/react-query';
import { apiService, FraudAnalysisDto, FraudRiskLevel, FraudType } from '@/services/api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X
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
  const { data, isLoading, error } = useQuery({
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
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'HIGH':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'MEDIUM':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'LOW':
        return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
      case 'SAFE':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
    }
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent Security', color: 'text-emerald-400', desc: 'Your inbox exhibits high trust levels.' };
    if (score >= 50) return { label: 'Attention Required', color: 'text-amber-400', desc: 'Suspicious domain patterns or spam detected.' };
    return { label: 'Critical Risks Found', color: 'text-red-400', desc: 'Immediate actions needed to protect against phishing.' };
  };

  const totalPages = data?.meta?.totalPages || 1;
  const score = stats?.metrics?.securityScore ?? 100;
  const scoreStatus = getScoreStatus(score);

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-sans flex items-center gap-3">
              Fraud & Phishing Intelligence Center
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">
                Active Scanners
              </span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Real-time sender domain checks, malicious URL analysis, BEC classification, and file hash scans.
            </p>
          </div>
        </div>

        {/* Security Summary Area (Score gauge and Top domains list) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dial Card */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col items-center text-center justify-between min-h-[280px]">
            <div className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Overall Security Rating</span>
              {score >= 80 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              )}
            </div>

            <div className="relative flex items-center justify-center my-4">
              {/* Radial Gauge */}
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-zinc-900 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className={`fill-none transition-all duration-1000 ${
                    score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-zinc-100">{score}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>

            <div>
              <h3 className={`font-bold text-base ${scoreStatus.color}`}>{scoreStatus.label}</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">{scoreStatus.desc}</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-red-500">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Critical Threats</span>
              <span className="text-3xl font-bold text-red-400 mt-2">{stats?.widgets?.criticalEmails ?? 0}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-orange-500">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">High Risk Alerts</span>
              <span className="text-3xl font-bold text-orange-400 mt-2">{stats?.widgets?.highRiskEmails ?? 0}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-indigo-500">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Scanned</span>
              <span className="text-3xl font-bold text-zinc-200 mt-2">{stats?.metrics?.totalScanned ?? 0}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-emerald-500">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Trustworthy Emails</span>
              <span className="text-3xl font-bold text-emerald-400 mt-2">{stats?.metrics?.safeEmailsCount ?? 0}</span>
            </div>
          </div>

          {/* Top Suspicious Domains Card */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between min-h-[280px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Top Suspicious Domains</span>
            </div>

            <div className="flex-1 mt-4 space-y-3 overflow-y-auto no-scrollbar">
              {!stats?.widgets?.topSuspiciousDomains || stats.widgets.topSuspiciousDomains.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic py-6">
                  No suspicious domains detected.
                </div>
              ) : (
                stats.widgets.topSuspiciousDomains.map((item, idx) => (
                  <div key={item.domain} className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-950/30 border border-zinc-900">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[10px] font-bold text-zinc-650 bg-zinc-900 border border-zinc-800 w-5 h-5 flex items-center justify-center rounded">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-300 truncate">{item.domain}</span>
                    </div>
                    <span className="font-bold text-red-400/90 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">
                      {item.count} threats
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search sender, subject, or explanation..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0c0c0e]/80 border border-zinc-800 focus:border-indigo-500/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Risk filter */}
            <div className="flex items-center gap-2 bg-[#0c0c0e]/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-semibold outline-none cursor-pointer"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="SAFE">Safe</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2 bg-[#0c0c0e]/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400">Threat Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-semibold outline-none cursor-pointer"
              >
                <option value="ALL">All Threat Types</option>
                <option value="NONE">None</option>
                <option value="PHISHING">Phishing</option>
                <option value="SPAM">Spam</option>
                <option value="SPOOFING">Spoofing</option>
                <option value="MALWARE">Malware</option>
                <option value="BEC">BEC</option>
                <option value="SCAM">Scam</option>
                <option value="IMPERSONATION">Impersonation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scanned Emails log list */}
        <div className="relative min-h-[300px] space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl border border-zinc-800 animate-pulse h-24" />
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel p-12 rounded-2xl border border-red-500/20 text-center text-red-400">
              Failed to load threat reports. Please try again.
            </div>
          ) : !data?.analyses || data.analyses.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-zinc-800 text-center flex flex-col items-center justify-center gap-4">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
              <div>
                <p className="font-semibold text-zinc-350">No threats detected</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Inbox security scan logs will populate as incoming emails are synchronized and processed.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden glass-panel">
              {data.analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-900/10 cursor-pointer transition-all duration-150"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getRiskColor(analysis.riskLevel)}`}>
                        {analysis.riskLevel}
                      </span>
                      {analysis.fraudType !== 'NONE' && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                          {analysis.fraudType}
                        </span>
                      )}
                    </div>
                    {analysis.email && (
                      <div>
                        <h4 className="font-bold text-zinc-200 text-sm truncate">{analysis.email.subject}</h4>
                        <p className="text-xs text-zinc-450 mt-1 flex items-center gap-2 truncate">
                          <User className="w-3.5 h-3.5 text-zinc-650" />
                          <span>{analysis.email.sender}</span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                          <span>{new Date(analysis.email.receivedAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/5 px-2.5 py-1.5 rounded-xl border border-indigo-500/15 group-hover:bg-indigo-500/10 transition-all font-semibold">
                      <Info className="w-3.5 h-3.5" />
                      View Analysis
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Security Detail Drawer Overlay */}
      <AnimatePresence>
        {selectedAnalysis && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed top-0 bottom-0 right-0 w-full sm:w-[480px] bg-[#0c0c0e] border-l border-zinc-800 z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-bold text-zinc-200 text-lg">Threat Intelligence Details</h2>
                  </div>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-1 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Risk Level Badge & Confidence */}
                <div className="flex items-center justify-between bg-zinc-950/60 p-4 rounded-xl border border-zinc-900">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Scanned Risk Level</p>
                    <span className={`inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(selectedAnalysis.riskLevel)}`}>
                      {selectedAnalysis.riskLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">AI Confidence Score</p>
                    <p className="text-base font-extrabold text-zinc-300 mt-1">{Math.round(selectedAnalysis.confidenceScore * 100)}%</p>
                  </div>
                </div>

                {/* Email Subject / Sender details */}
                {selectedAnalysis.email && (
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-950/30 border border-zinc-900/60 text-xs">
                    <p className="text-zinc-500">
                      From: <span className="font-bold text-zinc-300">{selectedAnalysis.email.sender}</span>
                    </p>
                    <p className="text-zinc-500">
                      Subject: <span className="font-bold text-zinc-300 leading-normal">{selectedAnalysis.email.subject}</span>
                    </p>
                  </div>
                )}

                {/* Explanation text */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    Threat Analysis Summary
                  </h3>
                  <p className="text-sm text-zinc-350 leading-relaxed bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl font-sans">
                    {selectedAnalysis.explanation}
                  </p>
                </div>

                {/* Indicators Warnings */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Security Risk Indicators
                  </h3>

                  <div className="space-y-2.5">
                    {!selectedAnalysis.indicators || selectedAnalysis.indicators.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-3">No warning indicators detected.</p>
                    ) : (
                      selectedAnalysis.indicators.map((indicator, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/10 bg-red-500/5 text-xs text-red-300 leading-relaxed font-sans">
                          <AlertTriangle className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                          <span>{indicator}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-end">
                <a
                  href={`/inbox?search=${encodeURIComponent(selectedAnalysis.email?.sender || '')}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/20"
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
