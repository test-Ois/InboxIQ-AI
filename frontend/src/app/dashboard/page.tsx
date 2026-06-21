'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Mail, RefreshCw, Unlink, Link2, Clock, Inbox, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiService.getMetrics,
    refetchInterval: 15000, // auto refetch metrics every 15s during sync
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


  // Mutations
  const connectMutation = useMutation({
    mutationFn: apiService.getConnectUrl,
    onSuccess: (data) => {
      // Redirect browser to Google Consent Screen
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
      }, 3000); // UI visual indicator timeout
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

  const isLoading = isMetricsLoading || isAccountsLoading || isAiStatsLoading || isTaskStatsLoading || isFraudStatsLoading;

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
          {/* Page Title & Top Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-sans">Workspace Dashboard</h1>
              <p className="text-sm text-zinc-400">Monitor your email synchronization status and metrics.</p>
            </div>
            <button
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" />
              Connect Gmail Account
            </button>
          </div>

          {/* Global Error Banner */}
          {actionError && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {actionError}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Connected Accounts</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : metrics?.connectedAccounts || 0}
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Synchronized Emails</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {isLoading ? <span className="inline-block w-16 h-6 bg-zinc-800 rounded animate-pulse" /> : metrics?.totalEmails || 0}
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Last Sync Time</p>
                <p className="text-sm font-bold text-zinc-200 mt-2">
                  {isLoading ? <span className="inline-block w-24 h-5 bg-zinc-800 rounded animate-pulse" /> : formatDate(metrics?.lastSyncTime || null)}
                </p>
              </div>
            </div>
          </div>

          {/* Security Integrity Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              href="/security"
              className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-emerald-500 hover:border-emerald-600 hover:bg-zinc-900/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Inbox Security Score</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-1">
                    {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : `${fraudStats?.metrics?.securityScore ?? 100}/100`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-650 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/security"
              className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-red-500 hover:border-red-600 hover:bg-zinc-900/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security Fraud Alerts</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-1">
                    {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : `${fraudStats?.metrics?.fraudAlertsCount ?? 0} threats`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-650 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* AI Intelligence Insights Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-200">AI Email Intelligence Insights</h2>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {/* Critical Emails Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-red-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Critical Emails</p>
                <p className="text-2xl font-bold text-red-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : aiStats?.criticalEmails || 0}
                </p>
              </div>

              {/* High Priority Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-orange-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">High Priority</p>
                <p className="text-2xl font-bold text-orange-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : aiStats?.highPriorityEmails || 0}
                </p>
              </div>

              {/* Action Required Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-amber-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action Required</p>
                <p className="text-2xl font-bold text-amber-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : aiStats?.actionRequiredEmails || 0}
                </p>
              </div>

              {/* Upcoming Deadlines Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-sky-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-sky-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : aiStats?.upcomingDeadlines || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Productivity Task Intelligence Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-200">Productivity Task Intelligence</h2>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">Active</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {/* My Tasks Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-indigo-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">My Tasks</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.myTasks || 0}
                </p>
              </div>

              {/* Due Today Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-amber-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due Today</p>
                <p className="text-2xl font-bold text-amber-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.dueToday || 0}
                </p>
              </div>

              {/* Upcoming Deadlines Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-sky-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-sky-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.upcomingDeadlines || 0}
                </p>
              </div>

              {/* Overdue Tasks Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-red-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.overdueTasks || 0}
                </p>
              </div>

              {/* Completed Tasks Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-emerald-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed Tasks</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.completedTasks || 0}
                </p>
              </div>

              {/* High Priority Tasks Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-orange-500">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">High Priority Tasks</p>
                <p className="text-2xl font-bold text-orange-400 mt-1.5">
                  {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.highPriorityTasks || 0}
                </p>
              </div>

              {/* AI Generated Tasks Today Widget */}
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-violet-500 col-span-1 sm:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Generated Tasks Today</p>
                    <p className="text-2xl font-bold text-violet-400 mt-1.5">
                      {isLoading ? <span className="inline-block w-8 h-6 bg-zinc-800 rounded animate-pulse" /> : taskStats?.widgets?.aiGeneratedToday || 0}
                    </p>
                  </div>
                  {taskStats && (
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Completion Rate</p>
                      <p className="text-sm font-bold text-zinc-300 mt-1">{taskStats.metrics.completionPercentage}%</p>
                    </div>
                  )}
                </div>
                {taskStats && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${taskStats.metrics.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


        {/* Connected Accounts Section */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
          <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">Connected Accounts</h2>
            <span className="text-xs text-zinc-500">Separated OAuth Scope System</span>
          </div>

          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="h-12 w-full bg-zinc-900/50 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-zinc-900/50 rounded-xl animate-pulse" />
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
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
                className="mt-2 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-850 text-indigo-400 rounded-lg cursor-pointer transition-all"
              >
                Connect Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900">
              {accounts.map((account) => (
                <div key={account.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-zinc-900/10 transition-all duration-150">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <Mail className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">{account.providerEmail}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Linked on {formatDate(account.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncMutation.isPending || syncingId === account.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingId === account.id ? 'animate-spin text-indigo-400' : ''}`} />
                      {syncingId === account.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800/80 hover:bg-red-500/10 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
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
