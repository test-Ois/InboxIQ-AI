'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useUIStore } from '@/store/useStore';
import {
  Search, Mail, ChevronLeft, ChevronRight, X,
  Sparkles, Tag, Star, Circle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageLoader } from '@/components/ui';

/* ── helpers ──────────────────────────────────────────────────── */
const itemVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** Return a consistent colour bucket for a sender string */
const avatarColor = (name: string): string => {
  const colors = [
    'from-violet-600 to-purple-700',
    'from-blue-600 to-indigo-700',
    'from-rose-600 to-pink-700',
    'from-emerald-600 to-teal-700',
    'from-amber-600 to-orange-700',
    'from-cyan-600 to-sky-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

/** Extract "Display Name" from "Display Name <email@x.com>" */
const parseSenderName = (sender: string): string => {
  const match = sender.match(/^([^<]+)/);
  return match ? match[1].trim() : sender;
};

/** Extract initials from a name */
const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const priorityDot: Record<string, string> = {
  Critical: 'bg-red-500',
  High:     'bg-orange-400',
  Medium:   'bg-yellow-400',
  Low:      'bg-zinc-600',
};

export default function InboxPage() {
  const {
    searchQuery, selectedLabel, selectedAccountId, currentPage,
    selectedEmailId, isDrawerOpen,
    setSearchQuery, setSelectedLabel, setSelectedAccountId,
    setCurrentPage, setSelectedEmailId, setIsDrawerOpen,
  } = useUIStore();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput, setSearchQuery]);

  const { data: accounts } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: apiService.getConnectedAccounts,
  });

  const { data: emailData, isLoading, isError } = useQuery({
    queryKey: ['emails', currentPage, searchQuery, selectedLabel, selectedAccountId],
    queryFn: () => apiService.getEmails({
      page: currentPage, limit: 15,
      search: searchQuery || undefined,
      label: selectedLabel || undefined,
      accountId: selectedAccountId || undefined,
    }),
  });

  const { data: activeEmail, isLoading: isActiveLoading } = useQuery({
    queryKey: ['email', selectedEmailId],
    queryFn: () => apiService.getEmailById(selectedEmailId || ''),
    enabled: !!selectedEmailId,
  });

  const handleEmailClick = (id: string) => { setSelectedEmailId(id); setIsDrawerOpen(true); };
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const labelFilters = [
    { label: 'All Messages', value: '' },
    { label: 'Inbox',        value: 'INBOX' },
    { label: 'Starred',      value: 'STARRED' },
    { label: 'Unread',       value: 'UNREAD' },
    { label: 'Important',    value: 'IMPORTANT' },
    { label: 'Sent',         value: 'SENT' },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <SidebarLayout>
      <div className="flex h-full overflow-hidden relative bg-[#070810]">

        {/* ══════════════════════════════════════════════════════════
            EMAIL LIST COLUMN
        ══════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/[0.05]">

          {/* ── Toolbar: Search + Account selector ──────────────── */}
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-3 shrink-0"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sender, subject, content…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] font-medium placeholder-zinc-600 text-zinc-200 focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(167,139,250,0.4)';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(109,40,217,0.12)';
                }}
                onBlur={e => {
                  (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Account selector */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold text-zinc-300 focus:outline-none cursor-pointer transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <option value="">All Accounts</option>
              {accounts?.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.providerEmail}</option>
              ))}
            </select>
          </div>

          {/* ── Tab pills ──────────────────────────────────────── */}
          <div className="px-4 border-b border-white/[0.05] flex gap-0.5 overflow-x-auto no-scrollbar shrink-0 pt-1">
            {labelFilters.map(lbl => {
              const active = selectedLabel === lbl.value;
              return (
                <button
                  key={lbl.value}
                  onClick={() => setSelectedLabel(lbl.value)}
                  className="relative px-4 py-3 text-[12px] font-semibold shrink-0 cursor-pointer transition-all duration-200 whitespace-nowrap"
                  style={{ color: active ? '#a78bfa' : '#71717a' }}
                >
                  {lbl.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Email rows ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {isLoading ? (
              <PageLoader text="Loading inbox" subtitle="Fetching your emails…" minHeight="min-h-[400px]" />
            ) : isError ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-[13px] font-semibold text-zinc-300">Could not load emails</p>
                <p className="text-[12px] text-zinc-600 max-w-xs">Check your connection and try again.</p>
              </div>
            ) : !emailData || emailData.emails.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl border border-white/[0.05] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <Mail className="w-6 h-6 text-zinc-600 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-zinc-400">No emails found</p>
                  <p className="text-[12px] text-zinc-600 mt-1">
                    {searchQuery ? 'Try a different search.' : 'Sync your inbox from the dashboard.'}
                  </p>
                </div>
              </div>
            ) : (
              <motion.div initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {emailData.emails.map((email) => {
                  const isSelected = selectedEmailId === email.id;
                  const isUnread   = email.labels.includes('UNREAD');
                  const analysis   = email.analysis;
                  const senderName = parseSenderName(email.sender);
                  const avatarGrad = avatarColor(senderName);
                  const init       = initials(senderName);

                  return (
                    <motion.div
                      key={email.id}
                      variants={itemVariants}
                      onClick={() => handleEmailClick(email.id)}
                      className="group relative flex items-start gap-4 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b"
                      style={{
                        background: isSelected
                          ? 'rgba(109,40,217,0.08)'
                          : isUnread
                            ? 'rgba(255,255,255,0.025)'
                            : 'transparent',
                        borderColor: 'rgba(255,255,255,0.04)',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.035)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.background =
                            isUnread ? 'rgba(255,255,255,0.025)' : 'transparent';
                      }}
                    >
                      {/* Unread accent line */}
                      {isUnread && !isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-[#7c3aed] to-[#a855f7]" />
                      )}

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5 shadow-sm`}>
                        {init}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Sender + date */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[13px] truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                            {senderName}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {analysis?.actionRequired && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
                              >
                                Action
                              </span>
                            )}
                            <span className={`text-[11px] ${isUnread ? 'font-bold text-zinc-300' : 'text-zinc-600 font-medium'}`}>
                              {formatDate(email.receivedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Subject */}
                        <div className="flex items-center gap-2 mb-0.5">
                          {analysis && (
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[analysis.priority] ?? 'bg-zinc-700'}`}
                              title={`Priority: ${analysis.priority}`}
                            />
                          )}
                          <p className={`text-[13px] truncate ${isUnread ? 'font-semibold text-zinc-100' : 'font-normal text-zinc-400'}`}>
                            {email.subject}
                          </p>
                        </div>

                        {/* Row 3: Preview / AI Summary */}
                        <p className="text-[12px] text-zinc-600 truncate leading-snug">
                          {analysis
                            ? <><span className="text-[#a78bfa] font-semibold">AI: </span>{analysis.summary}</>
                            : email.snippet
                          }
                        </p>

                        {/* Tags row */}
                        {analysis && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(109,40,217,0.12)', color: '#a78bfa', border: '1px solid rgba(109,40,217,0.2)' }}
                            >
                              {analysis.category}
                            </span>
                            {analysis.deadline && (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(251,146,60,0.08)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.15)' }}
                              >
                                Due {new Date(analysis.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hover star */}
                      <Star className="w-3.5 h-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────── */}
          {emailData && emailData.meta.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between shrink-0"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="text-[11px] text-zinc-600 font-medium">
                {emailData.meta.page}–{Math.min(emailData.meta.page * 15, emailData.meta.total)} of {emailData.meta.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === emailData.meta.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-white/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            DETAIL DRAWER
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="absolute md:relative top-0 right-0 bottom-0 w-full md:w-[500px] h-full z-30 flex flex-col border-l border-white/[0.05]"
              style={{ background: '#080b18', backdropFilter: 'blur(24px)' }}
            >
              {isActiveLoading || !activeEmail ? (
                <PageLoader text="Loading email" subtitle="Fetching content…" minHeight="min-h-[300px]" className="flex-1" />
              ) : (
                <>
                  {/* Drawer header */}
                  <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(parseSenderName(activeEmail.sender))} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md`}
                      >
                        {initials(parseSenderName(activeEmail.sender))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">{parseSenderName(activeEmail.sender)}</p>
                        <p className="text-[10px] text-zinc-600 font-mono truncate">{new Date(activeEmail.receivedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseDrawer}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 cursor-pointer transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 min-h-0">

                    {/* Subject */}
                    <h2 className="text-[16px] font-bold text-zinc-100 leading-snug">{activeEmail.subject}</h2>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-1.5">
                      {activeEmail.labels.map(label => (
                        <span key={label}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={
                            label === 'UNREAD'
                              ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                              : label === 'STARRED'
                              ? { background: 'rgba(234,179,8,0.1)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }
                              : { background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.05)' }
                          }
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* AI Analysis */}
                    {activeEmail.analysis && (
                      <div className="rounded-2xl p-5 space-y-4"
                        style={{ background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)' }}
                      >
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                            <span className="text-[11px] font-extrabold text-[#a78bfa] uppercase tracking-widest font-mono">AI Analysis</span>
                          </div>
                          <span className="text-[9px] text-zinc-600 font-mono uppercase">{activeEmail.analysis.modelName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Category',   value: activeEmail.analysis.category },
                            { label: 'Priority',   value: `${activeEmail.analysis.priority} · ${activeEmail.analysis.priorityScore}/100` },
                            { label: 'Action',     value: activeEmail.analysis.actionRequired ? 'Required' : 'None' },
                            {
                              label: 'Deadline',
                              value: activeEmail.analysis.deadline
                                ? new Date(activeEmail.analysis.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'None',
                            },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
                              <p className="text-[12px] font-semibold text-zinc-200">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-white/[0.04] pt-4">
                          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Summary</p>
                          <p className="text-[12px] text-zinc-300 leading-relaxed">{activeEmail.analysis.summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Snippet */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Message Preview</span>
                      </div>
                      <div className="rounded-2xl p-4 text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap min-h-[120px]"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {activeEmail.snippet || '(No preview available)'}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="rounded-2xl p-4 space-y-2.5"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Metadata</p>
                      {[
                        { key: 'Database ID',    val: activeEmail.id },
                        { key: 'Gmail Msg ID',   val: activeEmail.gmailMessageId },
                        { key: 'History ID',     val: activeEmail.gmailHistoryId || 'N/A' },
                        { key: 'Prompt Version', val: activeEmail.analysis?.promptVersion || 'N/A' },
                      ].map(({ key, val }) => (
                        <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                          <span className="text-[11px] text-zinc-600 font-mono">{key}</span>
                          <span className="text-[11px] text-zinc-400 font-mono select-all truncate max-w-[200px] text-right">{val}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
