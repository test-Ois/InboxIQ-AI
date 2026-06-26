'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Mail, RefreshCw, Unlink, Link2, Clock, Inbox, ShieldCheck, ShieldAlert, ChevronRight, Sparkles, Database, Bot, Calendar, AlertTriangle, ArrowUpRight, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ButtonLoader, PageLoader } from '@/components/ui';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 15, duration: 0.3 }
  }
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiService.getMetrics,
    refetchInterval: 15000,
  });

  const { data: aiStats, isLoading: isAiStatsLoading } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: apiService.getAiStats,
    refetchInterval: 15000,
  });

  const { data: taskStats, isLoading: isTaskStatsLoading } = useQuery({
    queryKey: ['task-stats'],
    queryFn: apiService.getTaskStats,
    refetchInterval: 15000,
  });

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: apiService.getConnectedAccounts,
  });

  const { data: fraudStats, isLoading: isFraudStatsLoading } = useQuery({
    queryKey: ['fraud-stats'],
    queryFn: apiService.getFraudStats,
    refetchInterval: 15000,
  });

  const { data: cleanupStats, isLoading: isCleanupStatsLoading } = useQuery({
    queryKey: ['cleanup-stats'],
    queryFn: apiService.getCleanupStats,
    refetchInterval: 15000,
  });

  const { data: copilotStats, isLoading: isCopilotStatsLoading } = useQuery({
    queryKey: ['copilot-stats'],
    queryFn: apiService.getCopilotStats,
    refetchInterval: 15000,
  });

  const { data: calendarStats, isLoading: isCalendarStatsLoading } = useQuery({
    queryKey: ['calendar-stats'],
    queryFn: apiService.getCalendarStats,
    refetchInterval: 15000,
  });

  // Mutations
  const connectMutation = useMutation({
    mutationFn: apiService.getConnectUrl,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to initiate Gmail connection.');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: apiService.disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['ai-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-latest'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to disconnect account.');
    },
  });

  const syncMutation = useMutation({
    mutationFn: apiService.triggerSync,
    onSuccess: (_, variables) => {
      setSyncingId(variables);
      setTimeout(() => {
        setSyncingId(null);
        queryClient.invalidateQueries({ queryKey: ['metrics'] });
        queryClient.invalidateQueries({ queryKey: ['ai-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cleanup-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cleanup-latest'] });
        queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
        queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      }, 3000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to trigger synchronization.');
    },
  });

  const handleConnect = () => {
    setActionError(null);
    connectMutation.mutate();
  };

  const handleDisconnect = (accountId: string) => {
    setActionError(null);
    if (confirm('Are you sure you want to disconnect this Gmail account? All synced email metadata will remain, but synchronization will stop.')) {
      disconnectMutation.mutate(accountId);
    }
  };

  const handleSync = (accountId: string) => {
    setActionError(null);
    syncMutation.mutate(accountId);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLoading =
    isMetricsLoading ||
    isAccountsLoading ||
    isAiStatsLoading ||
    isTaskStatsLoading ||
    isFraudStatsLoading ||
    isCleanupStatsLoading ||
    isCopilotStatsLoading ||
    isCalendarStatsLoading;

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-850 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-sans">
              Workspace Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Real-time status indicators, email synchronization metrics, and AI engines health status.</p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,58,237,0.25)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.35)] transition-all duration-200 cursor-pointer disabled:opacity-50 min-w-[200px]"
          >
            <ButtonLoader show={connectMutation.isPending}>
              <Link2 className="w-4 h-4" />
              Connect Gmail Account
            </ButtonLoader>
          </button>
        </div>

        {/* Global Error Banner */}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2.5 font-mono"
          >
            <AlertTriangle className="w-4 h-4" />
            {actionError}
          </motion.div>
        )}

        {isLoading ? (
          <PageLoader 
            text="Syncing dashboard workspace" 
            subtitle="Fetching connected account states and analytical counters..." 
            minHeight="min-h-[450px]"
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Bento Card 1: Core Metrics Row (Full width relative to top row) */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ y: -4 }}
              className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-br from-card/95 to-background/75 p-6 rounded-3xl border border-white/5 glass-panel"
            >
              <div className="flex flex-col justify-between p-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Connected</span>
                <div className="mt-4">
                  <p className="text-4xl font-extrabold text-white text-gradient-cyan tracking-tight">{metrics?.connectedAccounts || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1.5">Google Accounts</p>
                </div>
              </div>

              <div className="flex flex-col justify-between p-2 border-l border-zinc-900 pl-4 sm:pl-6">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Synchronized</span>
                <div className="mt-4">
                  <p className="text-4xl font-extrabold text-primary text-gradient-blue tracking-tight">{metrics?.totalEmails || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1.5">Emails Scanned</p>
                </div>
              </div>

              <div className="flex flex-col justify-between p-2 border-l border-zinc-900 pl-4 sm:pl-6">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Last Update</span>
                <div className="mt-4">
                  <p className="text-sm font-extrabold text-zinc-200 leading-snug font-mono">{formatDate(metrics?.lastSyncTime || null)}</p>
                  <p className="text-[10px] text-primary mt-2.5 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live Pipeline
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2: Security Score Highlight */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.005 }}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-l-4 border-royal-blue bg-gradient-to-br from-card/90 to-secondary/30 relative overflow-hidden group shadow-lg glow-sky"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-royal-blue/5 rounded-full blur-2xl pointer-events-none group-hover:bg-royal-blue/10 transition-colors duration-350" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Security Rating</span>
                <div className="w-8 h-8 rounded-lg bg-royal-blue/10 border border-royal-blue/25 flex items-center justify-center text-royal-blue shadow-sm">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="my-5 flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tight text-gradient-blue">
                  {fraudStats?.metrics?.securityScore ?? 100}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">/ 100 Health</span>
              </div>
              <Link href="/security" className="text-xs text-royal-blue font-bold flex items-center gap-1 hover:text-royal-blue transition-colors group/link">
                View Risk Assessment Dashboard
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Bento Card 3: Security Threats Alert Grid */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.005 }}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-l-4 border-red-pink bg-gradient-to-br from-card/90 to-secondary/30 relative overflow-hidden group shadow-lg glow-rose"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-pink/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Critical Threats</span>
                <div className="w-8 h-8 rounded-lg bg-red-pink/10 border border-red-pink/25 flex items-center justify-center text-red-pink shadow-sm">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="my-5">
                <p className="text-5xl font-black text-white tracking-tight text-gradient-rose font-mono">
                  {fraudStats?.metrics?.fraudAlertsCount ?? 0}
                </p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Malicious / Phishing attempts caught</p>
              </div>
              <Link href="/security" className="text-xs text-red-pink font-bold flex items-center gap-1 hover:text-red-pink transition-colors group/link">
                Audit Suspicious Signatures
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Bento Card 4: Inbox Health Score */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.005 }}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-l-4 border-primary bg-gradient-to-br from-card/85 to-secondary/30 relative overflow-hidden group shadow-lg glow-brand"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Inbox Cleanliness</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="my-5">
                <p className="text-5xl font-black text-white tracking-tight text-gradient-blue font-mono">
                  {cleanupStats?.inboxHealthScore ?? 100}%
                </p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Inbox Health and hygiene index</p>
              </div>
              <Link href="/cleanup" className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-hover transition-colors group/link">
                Initiate Hygiene Cleanup
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Bento Card 5: Estimated Storage Recovery */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.005 }}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-l-4 border-primary bg-gradient-to-br from-card/90 to-secondary/30 relative overflow-hidden group shadow-lg glow-brand"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Reclaimable Space</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Database className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="my-5">
                <p className="text-4xl font-black text-white tracking-tight text-gradient-blue font-mono">
                  {cleanupStats?.estimatedStorageRecoveryMB?.toFixed(1) ?? '0.0'} <span className="text-lg font-bold text-zinc-500 uppercase tracking-widest font-mono">MB</span>
                </p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Estimated bloat recovery potential</p>
              </div>
              <Link href="/cleanup" className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-hover transition-colors group/link">
                View Bloat Breakdown
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Bento Card 6: AI Copilot Assistant Activity */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="glass-panel p-6.5 rounded-3xl flex flex-col justify-between border-l-4 border-primary bg-gradient-to-br from-card/90 to-secondary/35 relative overflow-hidden group shadow-lg md:col-span-3"
            >
              <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-200 tracking-tight">AI Email Copilot Intelligence</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">LLM Assistant</p>
                  </div>
                </div>
                <Link href="/copilot" className="text-xs text-primary font-bold hover:text-primary-hover flex items-center gap-1.5">
                  Launch Copilot
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-mono">
                <div className="bg-zinc-950/40 p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Usage Count</p>
                  <p className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">{copilotStats?.totalUsageCount ?? 0}</p>
                </div>
                <div className="bg-zinc-950/40 p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Suggestions</p>
                  <p className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">{copilotStats?.suggestionsGenerated ?? 0}</p>
                </div>
                <div className="bg-zinc-950/40 p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Top Tone</p>
                  <p className="text-sm font-extrabold text-primary mt-3 truncate uppercase tracking-wide">{copilotStats?.mostUsedTone ?? 'NONE'}</p>
                </div>
                <div className="bg-zinc-950/40 p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between text-left">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Avg Latency</p>
                  <p className="text-2xl font-black text-zinc-100 mt-2 tracking-tight">
                    {copilotStats?.averageGenerationTimeMs ? `${(copilotStats.averageGenerationTimeMs / 1000).toFixed(1)}s` : '0.0s'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 7: Meeting & Calendar Intel */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="glass-panel p-6.5 rounded-3xl flex flex-col justify-between border-l-4 border-primary bg-gradient-to-br from-card/90 to-secondary/35 relative overflow-hidden group shadow-lg md:col-span-2"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-200 tracking-tight">Calendar & Meetings Intelligence</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">Google Calendar Link</p>
                  </div>
                </div>
                <Link href="/calendar" className="text-xs text-primary font-bold hover:text-primary-hover flex items-center gap-1.5">
                  Scheduler
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 font-mono text-center">
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Meetings</p>
                  <p className="text-xl font-black text-zinc-200 mt-2 tracking-tight">{calendarStats?.upcomingMeetings ?? 0}</p>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Interviews</p>
                  <p className="text-xl font-black text-zinc-200 mt-2 tracking-tight">{calendarStats?.interviewCount ?? 0}</p>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5 border-l-4 border-l-red-pink shadow-[inset_2px_0_0_0_#f43f5e]">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Conflicts</p>
                  <p className="text-xl font-black text-red-pink mt-2 tracking-tight">{calendarStats?.conflictCount ?? 0}</p>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Busy</p>
                  <p className="text-lg font-black text-zinc-200 mt-2.5 tracking-tight">{calendarStats?.busyHours ?? 0.0}h</p>
                </div>
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5 border-l-4 border-l-royal-blue shadow-[inset_2px_0_0_0_#2563eb]">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Available</p>
                  <p className="text-lg font-black text-royal-blue mt-2.5 tracking-tight">{calendarStats?.availableHours ?? 8.0}h</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 8: AI Priority Inbox Summaries */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.005 }}
              className="glass-panel p-6 rounded-3xl flex flex-col justify-between border-l-4 border-coral bg-gradient-to-br from-card/90 to-secondary/30 relative overflow-hidden group shadow-lg glow-emerald"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-coral/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">AI Priority Summary</span>
                <div className="w-8 h-8 rounded-lg bg-coral/10 border border-coral/25 flex items-center justify-center text-coral shadow-sm">
                  <Mail className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="my-4 space-y-2.5 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Critical Priority:</span>
                  <span className="font-extrabold text-red-pink font-mono">{aiStats?.criticalEmails || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">High Priority:</span>
                  <span className="font-extrabold text-coral font-mono">{aiStats?.highPriorityEmails || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Action Required:</span>
                  <span className="font-extrabold text-coral font-mono">{aiStats?.actionRequiredEmails || 0}</span>
                </div>
              </div>
              <Link href="/inbox" className="text-xs text-coral font-bold flex items-center gap-1 hover:text-coral transition-colors group/link">
                Open Priority Inbox
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Bento Card 9: Task Intelligence Progress View (Full width at bottom) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="glass-panel p-6.5 rounded-3xl border-l-4 border-primary bg-gradient-to-br from-card/90 to-secondary/35 relative overflow-hidden group shadow-lg md:col-span-3"
            >
              <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-200 tracking-tight">Tasks & Execution Intelligence</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">Task Tracker</p>
                  </div>
                </div>
                <Link href="/tasks" className="text-xs text-primary font-bold hover:text-primary-hover flex items-center gap-1.5">
                  Manage Tasks
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {taskStats && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-6 items-center">
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-bold text-zinc-400">Task Completion Rate</p>
                      <p className="text-base font-black text-primary tracking-tight font-mono">{taskStats.metrics.completionPercentage}%</p>
                    </div>
                    <div className="h-2 w-full bg-zinc-950/60 rounded-full overflow-hidden mt-2 border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                        style={{ width: `${taskStats.metrics.completionPercentage}%` }}
                      />
                    </div>
                  </div>
 
                  <div className="sm:col-span-3 grid grid-cols-4 gap-3 text-center font-mono">
                    <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">My Tasks</p>
                      <p className="text-lg font-black text-zinc-200 mt-1 tracking-tight">{taskStats?.widgets?.myTasks || 0}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Due Today</p>
                      <p className="text-lg font-black text-zinc-200 mt-1 tracking-tight">{taskStats?.widgets?.dueToday || 0}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5 border-l-2 border-l-red-pink shadow-[inset_2px_0_0_0_#f43f5e]">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Overdue</p>
                      <p className="text-lg font-black text-red-pink mt-1 tracking-tight">{taskStats?.widgets?.overdueTasks || 0}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">AI Tasks</p>
                      <p className="text-lg font-black text-zinc-200 mt-1 tracking-tight">{taskStats?.widgets?.aiGeneratedToday || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Connected Accounts Section */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-zinc-800">
          <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-200">Connected Accounts</h2>
            <span className="text-xs text-zinc-500 font-medium font-sans">Separated OAuth Scope System</span>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="h-12 w-full bg-zinc-900/50 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-zinc-900/50 rounded-xl animate-pulse" />
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4 font-sans">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-zinc-300">No active Gmail connection found</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Connect your Google account using our separated scope authorization flow to begin syncing emails.
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="mt-2 px-4 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-800 text-primary rounded-xl cursor-pointer transition-all"
              >
                Connect Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900">
              {accounts.map((account) => (
                <div key={account.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-900/10 transition-all duration-150 font-sans">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-450">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200 font-mono">{account.providerEmail}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Linked on {formatDate(account.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncMutation.isPending || syncingId === account.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold text-zinc-300 transition-all cursor-pointer disabled:opacity-50 font-mono min-w-[110px]"
                    >
                      <ButtonLoader show={syncingId === account.id}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync Now</span>
                      </ButtonLoader>
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800/80 hover:bg-red-500/10 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-all cursor-pointer disabled:opacity-50 font-mono"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
