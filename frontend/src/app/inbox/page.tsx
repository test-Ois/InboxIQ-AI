'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useUIStore } from '@/store/useStore';
import { Search, Mail, Filter, ChevronLeft, ChevronRight, X, Clock, Eye, AlertCircle, Sparkles, ShieldCheck, ShieldAlert, Tag, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

export default function InboxPage() {
  const {
    searchQuery,
    selectedLabel,
    selectedAccountId,
    currentPage,
    selectedEmailId,
    isDrawerOpen,
    setSearchQuery,
    setSelectedLabel,
    setSelectedAccountId,
    setCurrentPage,
    setSelectedEmailId,
    setIsDrawerOpen,
  } = useUIStore();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [searchInput, setSearchQuery]);

  const { data: accounts } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: apiService.getConnectedAccounts,
  });

  const { data: emailData, isLoading, isError } = useQuery({
    queryKey: ['emails', currentPage, searchQuery, selectedLabel, selectedAccountId],
    queryFn: () =>
      apiService.getEmails({
        page: currentPage,
        limit: 15,
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

  const handleEmailClick = (id: string) => {
    setSelectedEmailId(id);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const labelFilters = [
    { label: 'All Messages', value: '' },
    { label: 'Inbox', value: 'INBOX' },
    { label: 'Starred', value: 'STARRED' },
    { label: 'Unread', value: 'UNREAD' },
    { label: 'Important', value: 'IMPORTANT' },
    { label: 'Sent', value: 'SENT' },
  ];

  const formatEmailDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <SidebarLayout>
      <div className="flex h-full overflow-hidden relative bg-[#050816] h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]">
        
        {/* Main email feed list */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/5 bg-zinc-950/10">
          
          {/* Top Search bar & Selector */}
          <div className="px-6 py-5 border-b border-white/5 bg-zinc-950/20 flex flex-col md:flex-row gap-4 md:items-center justify-between shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sender, subject, content..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-[#0B1020]/45 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs text-zinc-200 placeholder-zinc-600 transition-all font-sans"
              />
            </div>
            
            {/* Account filter dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-white/5 bg-[#0B1020]/45 focus:outline-none focus:border-violet-500 text-xs text-zinc-300 font-bold cursor-pointer transition-all"
              >
                <option value="">All Accounts</option>
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.providerEmail}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels Subheader Filter */}
          <div className="px-6 py-3 border-b border-white/5 bg-zinc-950/30 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {labelFilters.map((lbl) => {
              const isActive = selectedLabel === lbl.value;
              return (
                <button
                  key={lbl.label}
                  onClick={() => setSelectedLabel(lbl.value)}
                  className={`px-4.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-[0_0_12px_rgba(124,58,237,0.12)]'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-950/30'
                  }`}
                >
                  {lbl.label}
                </button>
              );
            })}
          </div>

          {/* Email feed list wrapper */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] custom-scrollbar min-h-0">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="p-6 flex flex-col gap-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-1/4 bg-zinc-900 shimmer-bg rounded-lg" />
                    <div className="h-3 w-12 bg-zinc-900 shimmer-bg rounded-lg" />
                  </div>
                  <div className="h-4.5 w-2/3 bg-zinc-900 shimmer-bg rounded-lg" />
                  <div className="h-3.5 w-full bg-zinc-900/60 shimmer-bg rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-zinc-900 shimmer-bg rounded-full" />
                    <div className="h-4 w-20 bg-zinc-900 shimmer-bg rounded-full" />
                  </div>
                </div>
              ))
            ) : isError ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-rose-450 font-sans">
                <AlertCircle className="w-10 h-10 glow-rose text-rose-400" />
                <p className="font-bold text-sm">Failed to retrieve synchronized emails</p>
                <p className="text-xs text-zinc-500">Check your API gateway status or database connection.</p>
              </div>
            ) : !emailData || emailData.emails.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-5 text-zinc-550 h-full font-sans">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-500">
                  <Mail className="w-7 h-7 stroke-[1.25]" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-zinc-300 text-sm">No emails found</p>
                  <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mx-auto">
                    {searchQuery ? 'No messages match search filters.' : 'Trigger a manual sync in your dashboard to fetch logs.'}
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {emailData.emails.map((email) => {
                  const isSelected = selectedEmailId === email.id;
                  const isUnread = email.labels.includes('UNREAD');
                  const analysis = email.analysis;
                  
                  return (
                    <motion.div
                      key={email.id}
                      variants={itemVariants}
                      onClick={() => handleEmailClick(email.id)}
                      className={`p-5 flex flex-col gap-2.5 cursor-pointer transition-all duration-300 relative border-l-2 ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500 shadow-[inset_0_0_15px_rgba(124,58,237,0.03)]'
                          : isUnread
                          ? 'bg-zinc-950/15 border-cyan-400/80 hover:bg-[#0B1020]/25'
                          : 'hover:bg-zinc-950/15 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate max-w-[220px] flex items-center gap-1.5 font-sans ${isUnread ? 'font-bold text-zinc-200' : 'text-zinc-500 font-medium'}`}>
                          <User className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
                          {email.sender}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0 font-mono">
                          {analysis?.actionRequired && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 font-sans">
                              Action
                            </span>
                          )}
                          <span>{formatEmailDate(email.receivedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {analysis && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider shrink-0 font-mono ${
                              analysis.priority === 'Critical'
                                ? 'bg-red-500/10 text-red-400 border-red-500/25 glow-rose'
                                : analysis.priority === 'High'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                                : analysis.priority === 'Medium'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {analysis.priority}
                          </span>
                        )}
                        <h4 className={`text-sm truncate font-sans ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-300 font-medium'}`}>
                          {email.subject}
                        </h4>
                      </div>

                      <p className="text-xs text-zinc-400 font-medium leading-relaxed truncate font-sans">
                        {analysis ? (
                          <span className="text-zinc-400">
                            ✨ Summary: <span className="text-zinc-500 font-normal">{analysis.summary}</span>
                          </span>
                        ) : (
                          email.snippet
                        )}
                      </p>

                      {/* Labels and Categories badge */}
                      <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                        {analysis && (
                          <span className="text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                            📂 {analysis.category}
                          </span>
                        )}
                        {analysis?.deadline && (
                          <span className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-sans">
                            📅 Due: {new Date(analysis.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {email.labels
                          .filter((lbl) => !['UNREAD', 'CATEGORY_PERSONAL', 'CATEGORY_UPDATES', 'INBOX'].includes(lbl))
                          .slice(0, 1)
                          .map((label) => (
                            <span key={label} className="text-[9px] font-bold bg-zinc-950 text-zinc-500 border border-white/[0.03] px-2 py-0.5 rounded-full uppercase tracking-wide font-mono">
                              {label}
                            </span>
                          ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Pagination bar */}
          {emailData && emailData.meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/20 flex items-center justify-between shrink-0 font-sans">
              <span className="text-xs text-zinc-500">
                Page {emailData.meta.page} of {emailData.meta.totalPages} ({emailData.meta.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={currentPage === emailData.meta.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Sliding Detail Drawer Panel */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 200, duration: 0.3 }}
              className="absolute md:relative top-0 right-0 bottom-0 w-full md:w-[500px] h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l border-white/5 bg-[#0B1020]/90 backdrop-blur-[24px] flex flex-col z-30"
            >
              {isActiveLoading || !activeEmail ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin glow-brand" />
                  <span className="text-xs text-zinc-550 font-sans">Loading details...</span>
                </div>
              ) : (
                <>
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Metadata Inspector</span>
                    </div>
                    <button
                      onClick={handleCloseDrawer}
                      className="p-2 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 cursor-pointer transition-all hover:bg-zinc-950"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
                    
                    {/* Header profile */}
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-zinc-100 leading-snug font-sans">{activeEmail.subject}</h2>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 uppercase font-mono">
                          {activeEmail.sender.slice(0, 2)}
                        </div>
                        <div className="text-xs font-sans">
                          <p className="text-zinc-300 font-bold truncate max-w-[320px]">{activeEmail.sender}</p>
                          <p className="text-[10px] text-zinc-550 mt-0.5 font-mono">{new Date(activeEmail.receivedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-4">
                      {activeEmail.labels.map((label) => (
                        <span
                          key={label}
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono ${
                            label === 'UNREAD'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 glow-rose animate-pulse'
                              : label === 'STARRED'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-zinc-950 text-zinc-500 border-white/[0.02]'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* AI Analysis Panel */}
                    {activeEmail.analysis && (
                      <div className="p-5 rounded-3xl border border-violet-500/10 bg-violet-500/[0.01] space-y-4 shadow-sm relative overflow-hidden glow-brand">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            AI Intelligence
                          </h3>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Model: {activeEmail.analysis.modelName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                          <div>
                            <span className="text-zinc-550 block uppercase text-[9px] font-bold">Category</span>
                            <span className="text-zinc-300 font-bold mt-1 block">{activeEmail.analysis.category}</span>
                          </div>
                          <div>
                            <span className="text-zinc-550 block uppercase text-[9px] font-bold">Priority Level</span>
                            <span className="text-zinc-300 font-bold mt-1 block">
                              {activeEmail.analysis.priority} ({activeEmail.analysis.priorityScore}/100)
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-550 block uppercase text-[9px] font-bold">Action Required</span>
                            <span className={`font-bold mt-1 block ${activeEmail.analysis.actionRequired ? 'text-amber-400' : 'text-zinc-400'}`}>
                              {activeEmail.analysis.actionRequired ? 'YES' : 'NO'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-550 block uppercase text-[9px] font-bold">Extracted Deadline</span>
                            <span className="text-zinc-300 font-bold mt-1 block font-mono">
                              {activeEmail.analysis.deadline
                                ? new Date(activeEmail.analysis.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                                : 'None'}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-white/[0.04] pt-3.5">
                          <span className="text-[9px] text-zinc-500 block pb-1.5 font-bold uppercase tracking-wider font-mono">AI Email Summary</span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {activeEmail.analysis.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Body/Snippet representation */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Tag className="w-3.5 h-3.5 text-zinc-500" />
                        Email Snippet
                      </h3>
                      <div className="p-4.5 rounded-2xl border border-white/5 bg-zinc-950/40 text-xs text-zinc-300 leading-relaxed min-h-[140px] whitespace-pre-wrap font-sans">
                        {activeEmail.snippet || '(No body snippet available)'}
                      </div>
                    </div>

                    {/* Developer Metadata section */}
                    <div className="p-4.5 rounded-2xl border border-white/5 bg-zinc-950/60 space-y-3 shadow-inner">
                      <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Eye className="w-3.5 h-3.5" />
                        Infrastructure Inspection
                      </h4>
                      <div className="space-y-2.5 text-[10px] font-mono text-zinc-500 divide-y divide-white/[0.03]">
                        <div className="pt-0 pb-2 flex justify-between">
                          <span>Database ID:</span>
                          <span className="text-zinc-400 select-all font-sans">{activeEmail.id}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span>Prompt Version:</span>
                          <span className="text-zinc-400 select-all font-sans">{activeEmail.analysis?.promptVersion || 'N/A'}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span>Gmail Msg ID:</span>
                          <span className="text-zinc-400 select-all font-sans">{activeEmail.gmailMessageId}</span>
                        </div>
                        <div className="pt-2 flex justify-between">
                          <span>History ID:</span>
                          <span className="text-zinc-400 select-all font-sans">{activeEmail.gmailHistoryId || 'N/A'}</span>
                        </div>
                      </div>
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
