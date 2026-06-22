'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, CopilotSuggestionDto, CopilotTone, CopilotSuggestionType } from '@/services/api';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  History,
  MessageSquare,
  Pencil,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ListRestart,
  AlertCircle,
  CornerDownLeft,
  Zap,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function CopilotPage() {
  const queryClient = useQueryClient();
  
  // Tab control state: 'reply' | 'rewrite' | 'followup' | 'meeting' | 'summary' | 'history'
  const [activeTab, setActiveTab] = useState<'reply' | 'rewrite' | 'followup' | 'meeting' | 'summary' | 'history'>('reply');

  // Load emails list for selectors
  const { data: emailsData, isLoading: isEmailsLoading } = useQuery({
    queryKey: ['emails-list-copilot'],
    queryFn: () => apiService.getEmails({ limit: 50 }),
  });
  const emails = emailsData?.emails || [];

  // 1. Reply suggestion state & mutation
  const [replyEmailId, setReplyEmailId] = useState('');
  const [replyTone, setReplyTone] = useState<CopilotTone>('PROFESSIONAL');
  const [replyInstructions, setReplyInstructions] = useState('');
  const [replyResult, setReplyResult] = useState<CopilotSuggestionDto | null>(null);
  const [replyCopied, setReplyCopied] = useState(false);

  const replyMutation = useMutation({
    mutationFn: apiService.generateCopilotReply,
    onSuccess: (data) => {
      setReplyResult(data);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
    },
  });

  const handleGenerateReply = () => {
    if (!replyEmailId) return;
    replyMutation.mutate({
      emailId: replyEmailId,
      tone: replyTone,
      customInstructions: replyInstructions || undefined,
    });
  };

  // 2. Rewrite state & mutation
  const [rewriteText, setRewriteText] = useState('');
  const [rewriteTone, setRewriteTone] = useState<CopilotTone>('PROFESSIONAL');
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [rewriteResult, setRewriteResult] = useState<CopilotSuggestionDto | null>(null);
  const [rewriteCopied, setRewriteCopied] = useState(false);

  const rewriteMutation = useMutation({
    mutationFn: apiService.rewriteCopilotDraft,
    onSuccess: (data) => {
      setRewriteResult(data);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
    },
  });

  const handleRewriteDraft = () => {
    if (!rewriteText) return;
    rewriteMutation.mutate({
      text: rewriteText,
      tone: rewriteTone,
      customInstructions: rewriteInstructions || undefined,
    });
  };

  // 3. Followup state & mutation
  const [followupEmailId, setFollowupEmailId] = useState('');
  const [followupDelay, setFollowupDelay] = useState(3);
  const [followupResult, setFollowupResult] = useState<CopilotSuggestionDto | null>(null);
  const [followupCopied, setFollowupCopied] = useState(false);

  const followupMutation = useMutation({
    mutationFn: apiService.generateCopilotFollowup,
    onSuccess: (data) => {
      setFollowupResult(data);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
    },
  });

  const handleGenerateFollowup = () => {
    if (!followupEmailId) return;
    followupMutation.mutate({
      emailId: followupEmailId,
      delayDays: followupDelay,
    });
  };

  // 4. Meeting request state & mutation
  const [meetingEmailId, setMeetingEmailId] = useState('');
  const [meetingTemplate, setMeetingTemplate] = useState('Project Discussion');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingTimes, setMeetingTimes] = useState('');
  const [meetingResult, setMeetingResult] = useState<CopilotSuggestionDto | null>(null);
  const [meetingCopied, setMeetingCopied] = useState(false);

  const meetingMutation = useMutation({
    mutationFn: apiService.generateCopilotMeetingInvite,
    onSuccess: (data) => {
      setMeetingResult(data);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
    },
  });

  const handleGenerateMeeting = () => {
    if (!meetingAgenda) return;
    meetingMutation.mutate({
      emailId: meetingEmailId || undefined,
      template: meetingTemplate,
      agenda: meetingAgenda,
      durationMinutes: meetingDuration,
      preferredTimes: meetingTimes || undefined,
    });
  };

  // 5. Thread summary state & mutation
  const [summaryEmailId, setSummaryEmailId] = useState('');
  const [summaryResult, setSummaryResult] = useState<CopilotSuggestionDto | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);

  const summaryMutation = useMutation({
    mutationFn: apiService.summarizeCopilotThread,
    onSuccess: (data) => {
      setSummaryResult(data);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
    },
  });

  const handleSummarizeThread = () => {
    if (!summaryEmailId) return;
    summaryMutation.mutate({ emailId: summaryEmailId });
  };

  // 6. History lists & pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<CopilotSuggestionType | 'ALL'>('ALL');
  
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['copilot-history', historyPage, historyFilter],
    queryFn: () =>
      apiService.getCopilotHistory({
        page: historyPage,
        limit: 5,
        type: historyFilter === 'ALL' ? undefined : historyFilter,
      }),
  });

  const totalPages = historyData?.meta?.totalPages ?? 0;

  // 7. Usage stats & metadata
  const { data: copilotStats } = useQuery({
    queryKey: ['copilot-stats'],
    queryFn: apiService.getCopilotStats,
  });

  // Regenerate suggestion mutation
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  const regenerateMutation = useMutation({
    mutationFn: apiService.regenerateCopilotSuggestion,
    onSuccess: (data) => {
      setRegeneratingId(null);
      queryClient.invalidateQueries({ queryKey: ['copilot-history'] });
      queryClient.invalidateQueries({ queryKey: ['copilot-stats'] });
      
      if (activeTab === 'reply' && replyResult) setReplyResult(data);
      if (activeTab === 'rewrite' && rewriteResult) setRewriteResult(data);
      if (activeTab === 'followup' && followupResult) setFollowupResult(data);
      if (activeTab === 'meeting' && meetingResult) setMeetingResult(data);
      if (activeTab === 'summary' && summaryResult) setSummaryResult(data);
    },
    onError: () => {
      setRegeneratingId(null);
    }
  });

  const handleRegenerate = (suggestionId: string) => {
    setRegeneratingId(suggestionId);
    regenerateMutation.mutate({ suggestionId });
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const tones: { label: string; value: CopilotTone }[] = [
    { label: 'Professional', value: 'PROFESSIONAL' },
    { label: 'Casual', value: 'CASUAL' },
    { label: 'Apologetic', value: 'APOLOGETIC' },
    { label: 'Direct', value: 'DIRECT' },
    { label: 'Enthusiastic', value: 'ENTHUSIASTIC' },
  ];

  const templates = ['Project Discussion', 'Status Update', 'Interview', 'Client Meeting', 'Follow-Up'];

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
        
        {/* Header Block & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
              AI Copilot Playground
              <span className="text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider glow-brand">
                Gemini-1.5-Pro
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Interact with the inbox context using specialized prompt workflows, draft rewrites, and thread summaries.
            </p>
          </div>

          {/* Mini Quick Stats */}
          <div className="flex gap-4 items-center overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 border border-white/5 bg-zinc-950/40 px-3 py-1.5 rounded-xl">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] text-zinc-400 font-mono">Usage: <strong className="text-zinc-200">{copilotStats?.totalUsageCount ?? 0}</strong></span>
            </div>
            <div className="flex items-center gap-2 border border-white/5 bg-zinc-950/40 px-3 py-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-zinc-400 font-mono">Avg: <strong className="text-zinc-200">{copilotStats?.averageGenerationTimeMs ? `${(copilotStats.averageGenerationTimeMs / 1000).toFixed(1)}s` : '0.0s'}</strong></span>
            </div>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          
          {/* Left panel: mode selector */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col h-full bg-[#0B1020]/40">
              <span className="text-[10px] font-mono font-bold text-zinc-550 uppercase tracking-widest px-2 block mb-3">Modes</span>
              <div className="space-y-1.5 flex-grow overflow-y-auto custom-scrollbar">
                {(
                  [
                    { id: 'reply', label: 'Reply Draft', description: 'Context replies', icon: MessageSquare },
                    { id: 'rewrite', label: 'Rewrite Editor', description: 'Optimize draft tones', icon: Pencil },
                    { id: 'followup', label: 'Polite Follow-up', description: 'Reminder scheduling', icon: Clock },
                    { id: 'meeting', label: 'Meeting Scheduler', description: 'Calendar templates', icon: Calendar },
                    { id: 'summary', label: 'Thread Summary', description: 'Consolidate logs', icon: Bot },
                    { id: 'history', label: 'Playground Logs', description: 'Generation logs', icon: History },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 px-4.5 py-3 rounded-2xl text-left transition-all duration-300 relative border ${
                        isActive
                          ? 'bg-violet-500/10 border-violet-500/25 text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.06)]'
                          : 'border-transparent text-zinc-400 hover:bg-zinc-950/40 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block">{tab.label}</span>
                        <span className="text-[9px] text-zinc-500 block font-sans truncate">{tab.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Chat interface */}
          <div className="lg:col-span-3 glass-panel rounded-3xl border border-white/5 bg-[#0B1020]/25 flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
            
            {activeTab !== 'history' ? (
              // Playground chat flow
              <div className="flex flex-col h-full min-h-0">
                {/* 1. Settings top bar inside the playground */}
                <div className="p-4 border-b border-white/5 bg-zinc-950/20 flex flex-wrap gap-4 items-center">
                  
                  {activeTab === 'reply' && (
                    <>
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={replyEmailId}
                          onChange={(e) => setReplyEmailId(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="">-- Choose email context --</option>
                          {emails.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.sender.slice(0, 15)}: {e.subject.slice(0, 30)}...
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Tone:</span>
                        {tones.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setReplyTone(t.value)}
                            className={`px-2.5 py-1 border text-[9px] font-bold rounded-lg transition-all ${
                              replyTone === t.value
                                ? 'bg-violet-600 border-violet-500/40 text-white'
                                : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:text-zinc-250'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {activeTab === 'rewrite' && (
                    <>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Tone:</span>
                        {tones.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setRewriteTone(t.value)}
                            className={`px-2.5 py-1 border text-[9px] font-bold rounded-lg transition-all ${
                              rewriteTone === t.value
                                ? 'bg-violet-600 border-violet-500/40 text-white'
                                : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:text-zinc-250'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {activeTab === 'followup' && (
                    <>
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={followupEmailId}
                          onChange={(e) => setFollowupEmailId(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="">-- Choose email context --</option>
                          {emails.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.sender.slice(0, 15)}: {e.subject.slice(0, 30)}...
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase truncate">Delay Days:</span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={followupDelay}
                          onChange={(e) => setFollowupDelay(Number(e.target.value))}
                          className="w-16 bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-1.5 px-2 rounded-xl outline-none focus:border-violet-500 font-mono text-center"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'meeting' && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <select
                          value={meetingEmailId}
                          onChange={(e) => setMeetingEmailId(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="">-- Choose Context (Opt) --</option>
                          {emails.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.sender.slice(0, 10)}: {e.subject.slice(0, 20)}...
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={meetingTemplate}
                          onChange={(e) => setMeetingTemplate(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 transition-colors"
                        >
                          {templates.map((tpl) => (
                            <option key={tpl} value={tpl}>{tpl}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={meetingDuration}
                          onChange={(e) => setMeetingDuration(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-550 transition-colors"
                        >
                          <option value={15}>15 Mins</option>
                          <option value={30}>30 Mins</option>
                          <option value={45}>45 Mins</option>
                          <option value={60}>1 Hour</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Times (e.g. Mon 9am)"
                          value={meetingTimes}
                          onChange={(e) => setMeetingTimes(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={summaryEmailId}
                        onChange={(e) => setSummaryEmailId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-2 px-3 rounded-xl outline-none focus:border-violet-500 transition-colors"
                      >
                        <option value="">-- Choose email context to summarize --</option>
                        {emails.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.sender.slice(0, 15)}: {e.subject.slice(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>

                {/* 2. Chat history thread in the center */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0 bg-zinc-950/10">
                  
                  {activeTab === 'rewrite' && (
                    <div className="border border-white/5 bg-zinc-900/10 p-4.5 rounded-2xl space-y-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Source Draft Text to Rewrite</span>
                      <textarea
                        placeholder="Paste draft copy to rewrite here..."
                        value={rewriteText}
                        onChange={(e) => setRewriteText(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/5 text-xs text-zinc-300 py-3 px-4 rounded-xl outline-none focus:border-violet-500 h-28 placeholder:text-zinc-700 resize-none font-sans"
                      />
                    </div>
                  )}

                  {/* Render the chat simulation if data exists, otherwise render beautiful instructions placeholder */}
                  {(() => {
                    let hasResult = false;
                    let resultText = '';
                    let resultObj: CopilotSuggestionDto | null = null;
                    let resultCopied = false;
                    let resultSetter: (val: boolean) => void = () => {};
                    let placeholderIcon = Bot;
                    let placeholderText = '';

                    if (activeTab === 'reply') {
                      hasResult = !!replyResult;
                      resultText = replyResult?.generatedText || '';
                      resultObj = replyResult;
                      resultCopied = replyCopied;
                      resultSetter = setReplyCopied;
                      placeholderIcon = MessageSquare;
                      placeholderText = 'Select an email from context and enter custom prompt instructions to generate your draft reply.';
                    } else if (activeTab === 'rewrite') {
                      hasResult = !!rewriteResult;
                      resultText = rewriteResult?.generatedText || '';
                      resultObj = rewriteResult;
                      resultCopied = rewriteCopied;
                      resultSetter = setRewriteCopied;
                      placeholderIcon = Pencil;
                      placeholderText = 'Enter original draft copy and choose target tone parameters above to rewrite.';
                    } else if (activeTab === 'followup') {
                      hasResult = !!followupResult;
                      resultText = followupResult?.generatedText || '';
                      resultObj = followupResult;
                      resultCopied = followupCopied;
                      resultSetter = setFollowupCopied;
                      placeholderIcon = Clock;
                      placeholderText = 'Select reference email context and reminder delay parameters to draft followup alerts.';
                    } else if (activeTab === 'meeting') {
                      hasResult = !!meetingResult;
                      resultText = meetingResult?.generatedText || '';
                      resultObj = meetingResult;
                      resultCopied = meetingCopied;
                      resultSetter = setMeetingCopied;
                      placeholderIcon = Calendar;
                      placeholderText = 'Type meeting agendas and preferred timing specs below to build meeting invitations.';
                    } else if (activeTab === 'summary') {
                      hasResult = !!summaryResult;
                      resultText = summaryResult?.generatedText || '';
                      resultObj = summaryResult;
                      resultCopied = summaryCopied;
                      resultSetter = setSummaryCopied;
                      placeholderIcon = Bot;
                      placeholderText = 'Select target email threads above to synthesize key points, items, and digests.';
                    }

                    const IconComponent = placeholderIcon;

                    if (!hasResult) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-550 italic text-xs space-y-4">
                          <div className="w-12 h-12 bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 rounded-2xl shadow-inner">
                            <IconComponent className="w-6 h-6 stroke-[1.25]" />
                          </div>
                          <p className="max-w-md font-sans leading-relaxed">{placeholderText}</p>
                        </div>
                      );
                    }

                    // Render Chat Bubble Sequence
                    return (
                      <div className="space-y-6">
                        {/* User Bubble (Input Parameters & Context) */}
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-zinc-900 border border-white/5 px-4.5 py-3 rounded-2xl text-xs space-y-2 text-zinc-350 shadow-sm relative">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase block text-right">User Prompts</span>
                            
                            {activeTab === 'reply' && (
                              <p className="font-sans">Draft a <span className="font-bold text-violet-400 lowercase">{replyTone}</span> reply for email ID <code className="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500">{replyEmailId.slice(0, 8)}</code>. Instructions: &ldquo;{replyInstructions || 'No custom instruction specs'}&rdquo;</p>
                            )}
                            {activeTab === 'rewrite' && (
                              <p className="font-sans">Rewrite the draft to sound <span className="font-bold text-violet-400 lowercase">{rewriteTone}</span>. Guidelines: &ldquo;{rewriteInstructions || 'No instructions specs'}&rdquo;</p>
                            )}
                            {activeTab === 'followup' && (
                              <p className="font-sans">Draft followup reminder for context email <code className="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500">{followupEmailId.slice(0, 8)}</code> in {followupDelay} days.</p>
                            )}
                            {activeTab === 'meeting' && (
                              <p className="font-sans">Create meeting template <span className="font-bold text-violet-400">{meetingTemplate}</span> invite. Purpose: &ldquo;{meetingAgenda}&rdquo; duration: {meetingDuration} mins.</p>
                            )}
                            {activeTab === 'summary' && (
                              <p className="font-sans">Collapse email thread digest context ID <code className="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500">{summaryEmailId.slice(0, 8)}</code>.</p>
                            )}
                          </div>
                        </div>

                        {/* AI response Bubble */}
                        <div className="flex justify-start">
                          <div className="max-w-[90%] bg-zinc-950/45 border border-violet-500/10 p-5 rounded-2xl text-xs space-y-3.5 shadow-md relative">
                            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                              <span className="text-[9px] font-mono font-semibold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-violet-400 animate-pulse" /> Copilot Draft
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => copyToClipboard(resultText, resultSetter)}
                                  className="p-1 rounded border border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase transition-colors"
                                >
                                  {resultCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  {resultCopied ? 'Copied' : 'Copy'}
                                </button>
                                {resultObj && (
                                  <button
                                    onClick={() => handleRegenerate(resultObj.id)}
                                    disabled={regeneratingId === resultObj.id}
                                    className="p-1 rounded border border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase transition-colors"
                                  >
                                    <RefreshCw className={cn('w-3.5 h-3.5', regeneratingId === resultObj.id && 'animate-spin')} />
                                    Regen
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="font-sans text-zinc-300 leading-relaxed whitespace-pre-wrap select-all max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                              {resultText}
                            </div>

                            {resultObj && (
                              <div className="text-[9px] text-zinc-500 border-t border-white/[0.02] pt-2.5 flex items-center justify-between font-mono">
                                <span>Model: {resultObj.modelName}</span>
                                <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> {resultObj.estimatedCost?.toFixed(6) ?? '0.0000'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>

                {/* 3. Input prompt box at the bottom */}
                <div className="p-4 border-t border-white/5 bg-zinc-950/20 shrink-0">
                  <div className="relative flex items-center">
                    {(() => {
                      let placeholder = 'Ask AI Copilot...';
                      let btnDisabled = false;
                      let btnAction: () => void = () => {};
                      let textVal = '';
                      let textSetter: (val: string) => void = () => {};

                      if (activeTab === 'reply') {
                        placeholder = replyEmailId ? 'Enter reply constraints or notes here...' : 'Choose an email context in the settings bar first...';
                        btnDisabled = !replyEmailId || replyMutation.isPending;
                        btnAction = handleGenerateReply;
                        textVal = replyInstructions;
                        textSetter = setReplyInstructions;
                      } else if (activeTab === 'rewrite') {
                        placeholder = rewriteText ? 'Enter adjustment guidelines (e.g. make it shorter)...' : 'Paste original draft copy in editor panel first...';
                        btnDisabled = !rewriteText || rewriteMutation.isPending;
                        btnAction = handleRewriteDraft;
                        textVal = rewriteInstructions;
                        textSetter = setRewriteInstructions;
                      } else if (activeTab === 'followup') {
                        placeholder = followupEmailId ? 'Delay configuration selected. Press send to process draft...' : 'Choose reference email context in the settings bar first...';
                        btnDisabled = !followupEmailId || followupMutation.isPending;
                        btnAction = handleGenerateFollowup;
                        textVal = '';
                      } else if (activeTab === 'meeting') {
                        placeholder = 'Describe meeting details (e.g. candidate technical interview agenda)...';
                        btnDisabled = !meetingAgenda || meetingMutation.isPending;
                        btnAction = handleGenerateMeeting;
                        textVal = meetingAgenda;
                        textSetter = setMeetingAgenda;
                      } else if (activeTab === 'summary') {
                        placeholder = summaryEmailId ? 'Target context selected. Press send to synthesize digests...' : 'Choose email context thread in the settings bar first...';
                        btnDisabled = !summaryEmailId || summaryMutation.isPending;
                        btnAction = handleSummarizeThread;
                        textVal = '';
                      }

                      const isLoading =
                        replyMutation.isPending ||
                        rewriteMutation.isPending ||
                        followupMutation.isPending ||
                        meetingMutation.isPending ||
                        summaryMutation.isPending;

                      return (
                        <div className="w-full flex items-center bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden px-4.5 py-3 gap-3 relative shadow-inner">
                          {activeTab !== 'followup' && activeTab !== 'summary' ? (
                            <input
                              type="text"
                              value={textVal}
                              onChange={(e) => textSetter(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !btnDisabled) {
                                  btnAction();
                                }
                              }}
                              placeholder={placeholder}
                              disabled={btnDisabled && !isLoading}
                              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-650 outline-none font-sans"
                            />
                          ) : (
                            <span className="flex-1 text-xs text-zinc-550 truncate font-sans">
                              {placeholder}
                            </span>
                          )}

                          <button
                            onClick={btnAction}
                            disabled={btnDisabled}
                            className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl p-2.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shadow-lg shadow-violet-600/10 border border-violet-500/20 active:scale-95"
                          >
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
                            ) : (
                              <CornerDownLeft className="w-4 h-4 text-violet-100" />
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            ) : (
              // History Logs panel
              <div className="p-6 h-full flex flex-col min-h-0 bg-[#0B1020]/25 overflow-y-auto custom-scrollbar space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">Copilot Generation History</h3>
                    <p className="text-xs text-zinc-550 mt-0.5">Logs of past replies, rewrites, and thread digests.</p>
                  </div>

                  <select
                    value={historyFilter}
                    onChange={(e) => {
                      setHistoryFilter(e.target.value as any);
                      setHistoryPage(1);
                    }}
                    className="bg-zinc-950 border border-white/5 text-xs font-semibold text-zinc-350 px-3 py-2.5 rounded-xl outline-none cursor-pointer font-sans"
                  >
                    <option value="ALL">All Types</option>
                    <option value="REPLY">Reply Suggestions</option>
                    <option value="REWRITE">Rewrite Drafts</option>
                    <option value="FOLLOWUP">Follow-up reminders</option>
                    <option value="MEETING">Meeting Invitations</option>
                    <option value="SUMMARY">Thread Summaries</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar min-h-0">
                  {isHistoryLoading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="p-5 border border-white/5 bg-zinc-950/20 rounded-2xl animate-pulse h-28 shimmer-bg" />
                    ))
                  ) : !historyData?.history || historyData.history.length === 0 ? (
                    <div className="h-48 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-650 italic text-[11px] font-sans">
                      No previous copilot suggestions logs found matching filters.
                    </div>
                  ) : (
                    historyData.history.map((log: CopilotSuggestionDto) => (
                      <div
                        key={log.id}
                        className="p-5 border border-white/5 bg-zinc-950/15 rounded-2xl space-y-3.5 relative overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] pb-2.5">
                          <div className="flex items-center gap-3.5">
                            <span className="px-2 py-0.5 border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                              {log.suggestionType}
                            </span>
                            {log.tone && (
                              <span className="px-2 py-0.5 border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                                {log.tone}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(log.generatedText, () => {})}
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 text-[9px] font-bold border border-white/5 rounded-lg hover:bg-zinc-900 tracking-wider uppercase transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </button>
                            <button
                              onClick={() => handleRegenerate(log.id)}
                              disabled={regeneratingId === log.id}
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer flex items-center gap-1.5 text-[9px] font-bold border border-white/5 rounded-lg hover:bg-zinc-900 tracking-wider uppercase transition-colors"
                            >
                              <RefreshCw className={cn('w-3.5 h-3.5', regeneratingId === log.id && 'animate-spin')} />
                              Regen
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-sans text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto no-scrollbar bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                          {log.generatedText}
                        </div>

                        {log.email && (
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2 pt-1 font-sans">
                            <span>Subject:</span>
                            <span className="font-semibold text-zinc-400 truncate max-w-md">&ldquo;{log.email.subject}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5 shrink-0">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="p-2 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      Page {historyPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                      className="p-2 border border-zinc-800 rounded-xl text-zinc-550 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-zinc-950"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </SidebarLayout>
  );
}
