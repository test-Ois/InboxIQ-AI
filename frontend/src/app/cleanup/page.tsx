'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, CleanupAnalysisDto, RecommendationOutputDto } from '@/services/api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, ButtonLoader, PageLoader } from '@/components/ui';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  Layers,
  Inbox,
  CheckCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function CleanupPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 5;

  // Running state for polling manual sweeps
  const [isTriggering, setIsTriggering] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  // 1. Fetch Latest Cleanup Analysis
  const { data: latestAnalysis, isLoading: isLatestLoading, error: latestError } = useQuery({
    queryKey: ['cleanup-latest'],
    queryFn: apiService.getLatestCleanupAnalysis,
    retry: 1, // Don't spam retries on 404 (if none exists yet)
  });

  // 2. Fetch Cleanup Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['cleanup-stats'],
    queryFn: apiService.getCleanupStats,
  });

  // 3. Fetch Paginated Cleanup History
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['cleanup-history', page],
    queryFn: () => apiService.getCleanupAnalyses({ page, limit }),
  });

  // Store the initial analyzed timestamp when latest analysis finishes loading
  useEffect(() => {
    if (latestAnalysis?.analyzedAt) {
      setLastAnalyzedAt(latestAnalysis.analyzedAt);
    }
  }, [latestAnalysis]);

  // Mutation to trigger analysis
  const triggerMutation = useMutation({
    mutationFn: apiService.triggerCleanupSweep,
    onSuccess: () => {
      setIsTriggering(true);
      setPollCount(0);
    },
  });

  // Polling logic: if a sweep is running, poll stats every 3 seconds
  useEffect(() => {
    if (!isTriggering) return;

    const interval = setInterval(async () => {
      try {
        setPollCount((prev) => prev + 1);
        
        // Refetch latest analysis
        const currentLatest = await apiService.getLatestCleanupAnalysis();
        
        // If the analyzed timestamp has changed, the sweep completed successfully!
        if (currentLatest && currentLatest.analyzedAt !== lastAnalyzedAt) {
          setIsTriggering(false);
          setLastAnalyzedAt(currentLatest.analyzedAt);
          // Invalidate all related query keys to refresh page UI
          queryClient.invalidateQueries({ queryKey: ['cleanup-latest'] });
          queryClient.invalidateQueries({ queryKey: ['cleanup-stats'] });
          queryClient.invalidateQueries({ queryKey: ['cleanup-history'] });
          queryClient.invalidateQueries({ queryKey: ['emails'] });
          queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
        }
      } catch (err) {
        // Suppress 404/network errors during active polling
      }

      // Max polling duration: 15 attempts (45 seconds)
      if (pollCount >= 15) {
        setIsTriggering(false);
        queryClient.invalidateQueries({ queryKey: ['cleanup-latest'] });
        queryClient.invalidateQueries({ queryKey: ['cleanup-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cleanup-history'] });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isTriggering, pollCount, lastAnalyzedAt, queryClient]);

  const handleManualSweep = () => {
    if (isTriggering) return;
    triggerMutation.mutate();
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 50) return 'text-coral';
    return 'text-red-pink';
  };

  const getHealthBorderColor = (score: number) => {
    if (score >= 80) return 'border-primary/20';
    if (score >= 50) return 'border-coral/20';
    return 'border-red-pink/20';
  };

  const getHealthGradientId = (score: number) => {
    if (score >= 80) return 'health-primary';
    if (score >= 50) return 'health-amber';
    return 'health-rose';
  };

  const getHealthGlowColor = (score: number) => {
    if (score >= 80) return 'rgba(124, 58, 237, 0.4)';
    if (score >= 50) return 'rgba(255, 82, 81, 0.4)';
    return 'rgba(244, 63, 94, 0.4)';
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'DELETE':
        return 'text-red-pink bg-red-pink/10 border-red-pink/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]';
      case 'ARCHIVE':
        return 'text-primary bg-primary/10 border-primary/20 shadow-[0_0_12px_rgba(124,58,237,0.1)]';
      case 'REVIEW':
        return 'text-coral bg-coral/10 border-coral/20';
      case 'PRIORITIZE':
        return 'text-coral bg-coral/10 border-coral/20 shadow-[0_0_12px_rgba(255,82,81,0.1)]';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-800';
    }
  };

  const getActionBorderHighlight = (actionType: string) => {
    switch (actionType) {
      case 'DELETE':
        return 'border-l-2 border-l-red-pink/45';
      case 'ARCHIVE':
        return 'border-l-2 border-l-primary/45';
      case 'REVIEW':
        return 'border-l-2 border-l-coral/45';
      case 'PRIORITIZE':
        return 'border-l-2 border-l-coral/45';
      default:
        return 'border-l-2 border-l-transparent';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-pink border-red-pink/25 bg-red-pink/5';
      case 'MEDIUM':
        return 'text-coral border-coral/25 bg-coral/5';
      case 'LOW':
        return 'text-zinc-400 border-zinc-800 bg-zinc-900/40';
      default:
        return 'text-zinc-400 border-zinc-800 bg-zinc-900/40';
    }
  };

  // Safe checks for stats data
  const healthScore = stats?.inboxHealthScore ?? 100;
  const previousHealthScore = stats?.previousHealthScore;
  const totalClutter =
    (stats?.promotionalCount ?? 0) +
    (stats?.newsletterCount ?? 0) +
    (stats?.socialCount ?? 0) +
    (stats?.updatesCount ?? 0) +
    (stats?.clutterCount ?? 0);

  const totalPages = historyData?.meta?.totalPages ?? 1;

  // Category list mapping helper
  const categoryData = [
    { name: 'Promotional', count: stats?.promotionalCount ?? 0, color: 'bg-gradient-to-r from-royal-blue to-primary', size: (stats?.promotionalCount ?? 0) * 0.15 },
    { name: 'Newsletters', count: stats?.newsletterCount ?? 0, color: 'bg-gradient-to-r from-primary to-secondary', size: (stats?.newsletterCount ?? 0) * 0.12 },
    { name: 'Social Alerts', count: stats?.socialCount ?? 0, color: 'bg-gradient-to-r from-royal-blue to-royal-blue/60', size: (stats?.socialCount ?? 0) * 0.08 },
    { name: 'Updates', count: stats?.updatesCount ?? 0, color: 'bg-gradient-to-r from-secondary to-coral', size: (stats?.updatesCount ?? 0) * 0.05 },
    { name: 'Clutter / Junk', count: stats?.clutterCount ?? 0, color: 'bg-gradient-to-r from-coral to-red-pink', size: (stats?.clutterCount ?? 0) * 0.10 },
  ];

  const hasLoadedData = stats && stats.analyzedAt;

  // Framer Motion animations
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 18
      }
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Block */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="relative p-8 rounded-3xl overflow-hidden glass-panel border border-white/5 bg-gradient-to-br from-card/80 via-card/30 to-background"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 font-sans">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse glow-brand" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-mono">
                  Hygiene Scope: Last 90 Days
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Hygiene & Inbox Cleanup
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Maintain a clean and high-performance mailbox. Automatically categorize folders, analyze unread metrics, calculate storage recovery targets, and execute smart sweeps.
              </p>
            </div>

            <button
              onClick={handleManualSweep}
              disabled={isTriggering || triggerMutation.isPending}
              className="relative inline-flex items-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-hover text-xs font-bold text-white rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/35 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start md:self-auto shrink-0 border border-primary/30 font-mono min-w-[200px] min-h-[46px]"
            >
              <ButtonLoader show={isTriggering || triggerMutation.isPending}>
                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Analyze Inbox Hygiene</span>
              </ButtonLoader>
            </button>
          </div>
        </motion.div>

        {/* Global Loading or Empty States */}
        {isStatsLoading || isLatestLoading ? (
          <PageLoader 
            text="Syncing hygiene workstation" 
            subtitle="Retrieving clutter metrics and compiling storage recovery options..." 
            minHeight="min-h-[400px]"
          />
        ) : !hasLoadedData && !isTriggering ? (
          /* Empty / Initial State if no analysis exists */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-16 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center gap-6 relative overflow-hidden font-sans"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary z-10 glow-brand">
              <Inbox className="w-8 h-8 animate-pulse" />
            </div>
            <div className="z-10 space-y-2">
              <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Hygiene Score Awaiting Run</h3>
              <p className="text-xs text-zinc-450 max-w-md mx-auto leading-relaxed">
                No inbox analysis metrics are available yet. Let our AI evaluate your primary folders (defaulting to the last 90 days) to construct storage recovery indicators and categorizations.
              </p>
            </div>
            <button
              onClick={handleManualSweep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-xs font-bold text-white rounded-xl shadow-lg shadow-primary/20 cursor-pointer z-10 transition-all duration-300 hover:scale-102 border border-primary/30 font-mono"
            >
              <Sparkles className="w-4 h-4 text-white" />
              Generate First Analysis
            </button>
          </motion.div>
        ) : (
          /* Main Dashboard Content */
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Top Row Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Inbox Health Score Gauge */}
              <motion.div
                variants={itemVariants}
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center justify-between min-h-[320px] relative overflow-hidden group glass-panel-hover"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="w-full flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider z-10 font-mono">
                  <span>Inbox Integrity</span>
                  <CheckCircle className={`w-4 h-4 ${healthScore >= 80 ? 'text-primary' : 'text-amber-400'}`} />
                </div>

                <div className="relative flex items-center justify-center my-6 z-10">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <defs>
                      <linearGradient id="health-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#4c1d95" />
                      </linearGradient>
                      <linearGradient id="health-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff5251" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="health-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#be123c" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      className="stroke-zinc-900/60 fill-none"
                      strokeWidth="5"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      className="fill-none transition-all duration-1000"
                      strokeWidth="8"
                      stroke={`url(#${getHealthGradientId(healthScore)})`}
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={2 * Math.PI * 68 * (1 - healthScore / 100)}
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 8px ${getHealthGlowColor(healthScore)})` }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-white tracking-tight">{healthScore}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 font-mono">Health</span>
                  </div>
                </div>

                <div className="z-10 space-y-1">
                  <h3 className="font-extrabold text-sm text-zinc-200">
                    {healthScore >= 80
                      ? 'Optimal Cleanliness'
                      : healthScore >= 50
                      ? 'Mild Clutter Accrual'
                      : 'Critical Clutter Level'}
                  </h3>
                  
                  {previousHealthScore !== null && previousHealthScore !== undefined && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-sans mt-0.5">
                       <span>Previous: {previousHealthScore}</span>
                       <span>•</span>
                       <div className="flex items-center gap-0.5 font-bold">
                         {healthScore - previousHealthScore >= 0 ? (
                           <>
                             <TrendingUp className="w-3 h-3 text-royal-blue" />
                             <span className="text-royal-blue">+{healthScore - previousHealthScore}</span>
                           </>
                         ) : (
                           <>
                             <TrendingDown className="w-3 h-3 text-red-pink" />
                             <span className="text-red-pink">{healthScore - previousHealthScore}</span>
                           </>
                         )}
                       </div>
                     </div>
                  )}
                </div>
              </motion.div>

              {/* Storage Recovery Panel */}
              <motion.div
                variants={itemVariants}
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] relative overflow-hidden group bg-gradient-to-br from-card/90 via-card/40 to-background glass-panel-hover"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider z-10 font-mono">
                  <Database className="w-4 h-4 text-primary" />
                  <span>Recovery Target</span>
                </div>

                <div className="my-6 z-10 space-y-2">
                  <p className="text-5xl font-black tracking-tight text-gradient-blue font-mono">
                    {stats?.estimatedStorageRecoveryMB?.toFixed(1) ?? '0.0'}
                    <span className="text-lg font-extrabold text-zinc-400 ml-1.5 uppercase">MB</span>
                  </p>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    Estimated storage space reclaimable by archiving promotional mailer feeds, deleting clutter bulletins, and bulk purging social updates.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-950/60 border border-white/[0.04] rounded-2xl flex items-start gap-2.5 z-10">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                    Gmail sandbox safeguard: Delete, unsubscribe, and bulk clean features simulate logic execution. Real mailbox data remains fully protected.
                  </p>
                </div>
              </motion.div>

              {/* Clutter Summary Widget */}
              <motion.div
                variants={itemVariants}
                className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] relative overflow-hidden group glass-panel-hover"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider z-10 font-mono">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Clutter Summary</span>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 z-10 font-mono">
                  <div className="p-4 bg-zinc-950/50 border border-white/[0.03] rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total Clutter</span>
                    <span className="text-2xl font-black text-zinc-100 mt-1.5 block tracking-tight">{totalClutter} <span className="text-xs font-normal text-zinc-400">items</span></span>
                  </div>
                  <div className="p-4 bg-zinc-950/50 border border-white/[0.03] rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Unread Clutter</span>
                    <span className="text-2xl font-black text-amber-400 mt-1.5 block tracking-tight">{stats?.unreadClutterCount ?? 0} <span className="text-xs font-normal text-zinc-500">items</span></span>
                  </div>
                </div>

                <div className="text-xs text-zinc-455 border-t border-zinc-900/80 pt-3 z-10 flex justify-between items-center font-sans">
                  <div>
                    <span className="font-semibold text-zinc-300 block">Assessment Sync</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      {stats?.analyzedAt ? new Date(stats.analyzedAt).toLocaleString() : 'Pending Sweep Run'}
                    </span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-royal-blue" />
                </div>
              </motion.div>
            </div>

            {/* Category Breakdown & Action items grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Category Breakdown List */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">Hygiene Distribution</h3>
                  <p className="text-xs text-zinc-500 mt-1">Breakdown of flagged clutter elements in scope.</p>
                </div>

                <div className="space-y-4 flex-1 my-2 justify-center flex flex-col">
                  {categoryData.map((category) => {
                    const percentage = totalClutter > 0 ? (category.count / totalClutter) * 100 : 0;
                    return (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="font-semibold text-zinc-400">{category.name}</span>
                          <span className="font-bold text-zinc-300">
                            {category.count} <span className="text-[10px] text-zinc-500 font-normal">({category.size.toFixed(1)} MB)</span>
                          </span>
                        </div>
                        {/* Custom progress indicators */}
                        <div className="w-full h-2 bg-zinc-950 border border-white/[0.02] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${category.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-zinc-500 leading-relaxed font-sans bg-zinc-950/40 border border-white/[0.02] p-3.5 rounded-2xl italic">
                  Notice: Emails classified as IMPORTANT are filtered from hygiene summaries to protect your active critical inbox flow.
                </div>
              </motion.div>

              {/* Actionable recommendations lists */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden"
              >
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    AI Cleanup Recommendations
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-sans font-medium">Smart cleanup advice compiled by our analysis engines.</p>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0 ? (
                    latestAnalysis.recommendations.map((recommendation: RecommendationOutputDto) => (
                      <div
                        key={recommendation.id}
                        className={`p-4 border border-white/[0.03] bg-zinc-950/20 hover:bg-zinc-950/55 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${getActionBorderHighlight(recommendation.actionType)}`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wider ${getActionColor(recommendation.actionType)}`}>
                              {recommendation.actionType}
                            </span>
                            <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wider ${getPriorityColor(recommendation.priority)}`}>
                              {recommendation.priority} Priority
                            </span>
                            <span className="text-[9px] text-zinc-400 bg-zinc-900/50 border border-zinc-800/80 px-2 py-0.5 rounded font-mono font-medium">
                              {recommendation.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-zinc-200 text-sm leading-snug">{recommendation.title}</h4>
                          <p className="text-xs text-zinc-450 leading-relaxed font-sans">{recommendation.description}</p>
                        </div>

                        {/* Recommendation storage info */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-zinc-900/50 pt-2.5 sm:pt-0 shrink-0 font-sans">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Reclaim Target</span>
                          <span className="text-base font-black text-primary mt-0.5">{recommendation.estimatedStorageRecoveryMB.toFixed(1)} MB</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">{recommendation.affectedCount} emails</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-48 border border-dashed border-zinc-800/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 italic text-xs">
                      No sweep recommendations available. Execute a hygiene scan.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Historical Scan Logs */}
            <motion.div
              variants={itemVariants}
              className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <FileText className="w-4 h-4 text-primary" />
                  Historical Cleanliness Audits
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Audit trail of overall mailbox health levels and estimates over time.</p>
              </div>

              <div className="relative overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/20">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      <th className="py-4.5 px-5">Scan Date</th>
                      <th className="py-4.5 px-5">Health Score</th>
                      <th className="py-4.5 px-5">Clutter Breakdown</th>
                      <th className="py-4.5 px-5">Storage Recovery</th>
                      <th className="py-4.5 px-5">Action Cards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-xs">
                    {isHistoryLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader size="md" />
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider animate-pulse">Syncing audit logs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !historyData?.analyses || historyData.analyses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-5 text-center text-zinc-500 italic">
                          No historical scans registered.
                        </td>
                      </tr>
                    ) : (
                      historyData.analyses.map((analysis) => {
                        const total =
                          analysis.promotionalCount +
                          analysis.newsletterCount +
                          analysis.socialCount +
                          analysis.updatesCount +
                          analysis.clutterCount;
                        const recs = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];

                        return (
                           <tr key={analysis.id} className="hover:bg-zinc-900/10 transition-colors">
                            <td className="py-4 px-5 font-bold text-zinc-350 font-mono">
                              {new Date(analysis.analyzedAt).toLocaleString()}
                            </td>
                            <td className="py-4 px-5 font-bold">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getHealthColor(analysis.inboxHealthScore)} ${getHealthBorderColor(analysis.inboxHealthScore)} bg-zinc-950/60 font-mono`}>
                                {analysis.inboxHealthScore}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-zinc-400">
                              {total} clutter items ({analysis.promotionalCount} promo, {analysis.newsletterCount} news)
                            </td>
                            <td className="py-4 px-5 text-primary font-extrabold font-mono">
                              {analysis.estimatedStorageRecoveryMB.toFixed(1)} MB
                            </td>
                            <td className="py-4 px-5 text-zinc-550">
                              {recs.length} cards recommended
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* History pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
