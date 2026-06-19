'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useUIStore } from '@/store/useStore';
import { Search, Mail, Filter, ChevronLeft, ChevronRight, X, Clock, Eye, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function InboxPage() {
  // Global Store UI states
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

  // Sync state input field
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 4000); // 400ms debounce
    return () => clearTimeout(handler);
  }, [searchInput, setSearchQuery]);

  // Query connected accounts for selector
  const { data: accounts } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: apiService.getConnectedAccounts,
  });

  // Query emails matching filters
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

  // Query single selected email details
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
    
    // If today, show time. Otherwise, show date.
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <SidebarLayout>
      <div className="flex h-full overflow-hidden relative">
        
        {/* Main email feed list */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-zinc-900 bg-[#09090b]">
          
          {/* Top Search bar & Selector */}
          <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex flex-col md:flex-row gap-4 md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sender, subject, content..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-zinc-200 placeholder-zinc-500 transition-all"
              />
            </div>
            
            {/* Account filter dropdown */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 focus:outline-none focus:border-indigo-500 text-xs text-zinc-300 font-medium cursor-pointer"
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

          {/* Labels Subheader Filter for Desktop */}
          <div className="px-6 py-2 border-b border-zinc-900 bg-[#0c0c0e] flex gap-2 overflow-x-auto no-scrollbar">
            {labelFilters.map((lbl) => (
              <button
                key={lbl.label}
                onClick={() => setSelectedLabel(lbl.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                  selectedLabel === lbl.value
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                {lbl.label}
              </button>
            ))}
          </div>

          {/* Email feed list wrapper */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 no-scrollbar">
            {isLoading ? (
              // Loading skeleton screen
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-6 flex flex-col gap-2.5 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 w-1/4 bg-zinc-900 rounded" />
                    <div className="h-3 w-12 bg-zinc-900 rounded" />
                  </div>
                  <div className="h-4 w-1/2 bg-zinc-900 rounded" />
                  <div className="h-3 w-full bg-zinc-900/60 rounded" />
                </div>
              ))
            ) : isError ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-red-400">
                <AlertCircle className="w-10 h-10" />
                <p className="font-semibold text-sm">Failed to retrieve synchronized emails</p>
                <p className="text-xs text-zinc-500">Check your API gateway status or database migrator connection.</p>
              </div>
            ) : !emailData || emailData.emails.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-zinc-500">
                <Mail className="w-12 h-12 stroke-[1.5]" />
                <div>
                  <p className="font-semibold text-zinc-400">No emails found</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                    {searchQuery ? 'Try clearing your search filters' : 'Trigger a manual sync in your dashboard to fetch logs.'}
                  </p>
                </div>
              </div>
            ) : (
              emailData.emails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const isUnread = email.labels.includes('UNREAD');
                const analysis = email.analysis;
                
                return (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email.id)}
                    className={`p-5 flex flex-col gap-2.5 cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-zinc-900/40 border-l-2 border-indigo-500'
                        : isUnread
                        ? 'bg-indigo-500/[0.02] border-l-2 border-indigo-400/40'
                        : 'hover:bg-zinc-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs truncate max-w-[200px] ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>
                        {email.sender}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0">
                        {analysis?.actionRequired && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Action Required
                          </span>
                        )}
                        <span>{formatEmailDate(email.receivedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {analysis && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border tracking-wider shrink-0 ${
                            analysis.priority === 'Critical'
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : analysis.priority === 'High'
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                              : analysis.priority === 'Medium'
                              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {analysis.priority}
                        </span>
                      )}
                      <h4 className={`text-sm truncate ${isUnread ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>
                        {email.subject}
                      </h4>
                    </div>

                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {analysis ? (
                        <span className="text-zinc-300 font-medium">
                          ✨ AI Summary: <span className="text-zinc-400 font-normal">{analysis.summary}</span>
                        </span>
                      ) : (
                        email.snippet
                      )}
                    </p>

                    {/* Labels and Categories badge */}
                    <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                      {analysis && (
                        <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          📂 {analysis.category}
                        </span>
                      )}
                      {analysis?.deadline && (
                        <span className="text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                          📅 Due: {new Date(analysis.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {email.labels
                        .filter((lbl) => !['UNREAD', 'CATEGORY_PERSONAL', 'CATEGORY_UPDATES', 'INBOX'].includes(lbl))
                        .slice(0, 2)
                        .map((label) => (
                          <span key={label} className="text-[9px] font-bold bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full">
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination bar */}
          {emailData && emailData.meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-zinc-900 bg-zinc-900/10 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Page {emailData.meta.page} of {emailData.meta.totalPages} ({emailData.meta.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-30"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={currentPage === emailData.meta.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-30"
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
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="absolute md:relative top-0 right-0 bottom-0 w-full md:w-[480px] h-full shadow-2xl border-l border-zinc-800 bg-[#0c0c0e] flex flex-col z-30"
            >
              {isActiveLoading || !activeEmail ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-500">Loading email logs...</span>
                </div>
              ) : (
                <>
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Metadata Details</span>
                    </div>
                    <button
                      onClick={handleCloseDrawer}
                      className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    
                    {/* Header profile */}
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-100 leading-snug">{activeEmail.subject}</h2>
                      <p className="text-xs text-zinc-400 pt-1">From: {activeEmail.sender}</p>
                      <p className="text-[10px] text-zinc-500">Received: {new Date(activeEmail.receivedAt).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {activeEmail.labels.map((label) => (
                        <span
                          key={label}
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                            label === 'UNREAD'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : label === 'STARRED'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* AI Analysis Panel */}
                    {activeEmail.analysis && (
                      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            ✨ AI Inbox Intelligence
                          </h3>
                          <span className="text-[10px] text-zinc-500">Model: {activeEmail.analysis.modelName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-zinc-500 block">Category</span>
                            <span className="text-zinc-300 font-semibold mt-1 block">{activeEmail.analysis.category}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Priority Level (Score)</span>
                            <span className="text-zinc-300 font-semibold mt-1 block">
                              {activeEmail.analysis.priority} ({activeEmail.analysis.priorityScore}/100)
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Action Required</span>
                            <span className={`font-semibold mt-1 block ${activeEmail.analysis.actionRequired ? 'text-amber-400' : 'text-zinc-400'}`}>
                              {activeEmail.analysis.actionRequired ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Extracted Deadline</span>
                            <span className="text-zinc-300 font-semibold mt-1 block">
                              {activeEmail.analysis.deadline
                                ? new Date(activeEmail.analysis.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                                : 'None'}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-zinc-900/60 pt-3">
                          <span className="text-xs text-zinc-500 block pb-1.5 font-semibold">AI Generated Summary</span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {activeEmail.analysis.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-zinc-900" />

                    {/* Body/Snippet representation */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Content Snippet</h3>
                      <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/40 text-sm text-zinc-300 leading-relaxed min-h-[120px] whitespace-pre-wrap">
                        {activeEmail.snippet || '(No body snippet available)'}
                      </div>
                    </div>

                    {/* Developer Metadata section */}
                    <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/60 space-y-3">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Infrastructure Inspection
                      </h4>
                      <div className="space-y-2 text-[10px] font-mono text-zinc-500 divide-y divide-zinc-900">
                        <div className="pt-0 pb-1.5 flex justify-between">
                          <span>Database ID:</span>
                          <span className="text-zinc-400 select-all">{activeEmail.id}</span>
                        </div>
                        <div className="py-1.5 flex justify-between">
                          <span>Prompt Version:</span>
                          <span className="text-zinc-400 select-all">{activeEmail.analysis?.promptVersion || 'N/A'}</span>
                        </div>
                        <div className="py-1.5 flex justify-between">
                          <span>Gmail Msg ID:</span>
                          <span className="text-zinc-400 select-all">{activeEmail.gmailMessageId}</span>
                        </div>
                        <div className="pt-1.5 flex justify-between">
                          <span>History ID:</span>
                          <span className="text-zinc-400 select-all">{activeEmail.gmailHistoryId || 'N/A'}</span>
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
