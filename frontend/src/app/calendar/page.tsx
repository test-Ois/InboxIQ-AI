'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, CalendarEventDto } from '@/services/api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, InlineLoader, PageLoader, ButtonLoader } from '@/components/ui';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle,
  Sparkles,
  MapPin,
  Video,
  Users,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'interviews' | 'conflicts' | 'availability'>('today');

  // Load calendar events
  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => apiService.getCalendarEvents({ limit: 100 }),
  });
  const events = eventsData?.events || [];

  // Filter events
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  endOfDate(todayEnd);

  function endOfDate(d: Date) {
    d.setHours(23, 59, 59, 999);
  }

  const todayEvents = events.filter((e) => {
    const start = new Date(e.startTime);
    return start >= todayStart && start <= todayEnd && e.status !== 'CANCELLED';
  });

  const upcomingEvents = events.filter((e) => {
    const start = new Date(e.startTime);
    return start > todayEnd && e.status !== 'CANCELLED';
  });

  const interviewEvents = events.filter((e) => e.meetingType === 'INTERVIEW');
  const conflictEvents = events.filter((e) => e.isConflict && e.status !== 'CANCELLED');

  // Conflict range check states
  const [conflictStart, setConflictStart] = useState('');
  const [conflictEnd, setConflictEnd] = useState('');
  const [conflictCheckResult, setConflictCheckResult] = useState<{
    hasConflict: boolean;
    conflictsCount: number;
    overlappingEvents: { id: string; title: string; meetingType: string }[];
  } | null>(null);

  const conflictCheckMutation = useMutation({
    mutationFn: apiService.checkCalendarConflict,
    onSuccess: (data) => {
      setConflictCheckResult(data);
    },
  });

  const handleCheckConflict = () => {
    if (!conflictStart || !conflictEnd) return;
    conflictCheckMutation.mutate({
      startTime: new Date(conflictStart).toISOString(),
      endTime: new Date(conflictEnd).toISOString(),
    });
  };

  // Availability slot suggest states
  const [slotDateStart, setSlotDateStart] = useState('');
  const [slotDateEnd, setSlotDateEnd] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotWorkStart, setSlotWorkStart] = useState(9);
  const [slotWorkEnd, setSlotWorkEnd] = useState(17);
  const [suggestedSlots, setSuggestedSlots] = useState<{ startTime: string; endTime: string; ranking: number }[]>([]);
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);

  const suggestSlotsMutation = useMutation({
    mutationFn: apiService.suggestCalendarSlots,
    onSuccess: (data) => {
      setSuggestedSlots(data.availableSlots || []);
    },
  });

  const handleSuggestSlots = () => {
    if (!slotDateStart || !slotDateEnd) return;
    suggestSlotsMutation.mutate({
      startDate: slotDateStart,
      endDate: slotDateEnd,
      durationMinutes: slotDuration,
      workHourStart: slotWorkStart,
      workHourEnd: slotWorkEnd,
    });
  };

  const copySlotText = (slot: { startTime: string; endTime: string }) => {
    const formatted = `${new Date(slot.startTime).toLocaleDateString()} ${new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (UTC)`;
    navigator.clipboard.writeText(formatted);
    setCopiedSlot(slot.startTime);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const formatCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return 'Passed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      if (hours === 0) {
        const mins = Math.floor(diff / (1000 * 60));
        return `${mins}m left`;
      }
      return `${hours}h left`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const getMeetingTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'INTERVIEW':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'CLIENT_MEETING':
        return 'bg-royal-blue/10 border-royal-blue/20 text-royal-blue';
      case 'STATUS_UPDATE':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'PROJECT_DISCUSSION':
        return 'bg-secondary/10 border-secondary/20 text-secondary';
      case 'FOLLOW_UP':
        return 'bg-coral/10 border-coral/20 text-coral';
      default:
        return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-royal-blue/10 border-royal-blue/20 text-royal-blue';
      case 'TENTATIVE':
        return 'bg-coral/10 border-coral/20 text-coral';
      case 'CANCELLED':
        return 'bg-red-pink/10 border-red-pink/20 text-red-pink';
      default:
        return 'bg-zinc-900 border-zinc-800 text-zinc-550';
    }
  };

  // Queries for stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['calendar-stats'],
    queryFn: apiService.getCalendarStats,
  });

  const containerVariants = {
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
        
        {/* Header Section */}
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
                  Calendar sync
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Calendar Workspace
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Synchronize extracted calendar events, audit schedules, analyze busy times, and view available meeting slots.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick analytics headers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <motion.div variants={itemVariants} className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-card/45 glass-panel-hover">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Upcoming</span>
            <span className="text-2xl font-black text-white mt-1 block">
              {isStatsLoading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : stats?.upcomingMeetings ?? 0}
            </span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-card/45 glass-panel-hover">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Interviews</span>
            <span className="text-2xl font-black text-primary mt-1 block">
              {isStatsLoading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : stats?.interviewCount ?? 0}
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-4.5 rounded-2xl border border-red-pink/10 bg-card/45 border-l-4 border-l-red-pink glow-rose glass-panel-hover">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Conflicts</span>
            <span className="text-2xl font-black text-red-pink mt-1 block font-mono">
              {isStatsLoading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : stats?.conflictCount ?? 0}
            </span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-card/45 glass-panel-hover">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Busy Hours</span>
            <span className="text-2xl font-black text-coral mt-1 block">
              {isStatsLoading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : `${stats?.busyHours ?? 0.0}h`}
            </span>
          </motion.div>
 
          <motion.div variants={itemVariants} className="glass-panel p-4.5 rounded-2xl border border-royal-blue/10 bg-card/45 border-l-4 border-l-royal-blue glow-sky glass-panel-hover">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Available</span>
            <span className="text-2xl font-black text-royal-blue mt-1 block">
              {isStatsLoading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : `${stats?.availableHours ?? 8.0}h`}
            </span>
          </motion.div>
        </motion.div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth font-sans">
          {(
            [
              { id: 'today', label: "Today's Meetings", icon: Clock },
              { id: 'upcoming', label: 'Upcoming Agenda', icon: CalendarIcon },
              { id: 'interviews', label: 'Interview Tracking', icon: User },
              { id: 'conflicts', label: 'Conflict Dashboard', icon: AlertTriangle },
              { id: 'availability', label: 'Slot Availability', icon: Sparkles },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-5 border-b-2 font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Workspace Panels */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-card/50 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. TODAY AGENDA TIMELINE */}
            {activeTab === 'today' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Today&apos;s Timeline</h3>
                  <span className="text-xs text-zinc-400 font-bold font-sans">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>

                {isEventsLoading ? (
                  <PageLoader
                    text="Syncing today's meetings..."
                    subtitle="Fetching from your calendar provider..."
                    minHeight="min-h-[250px]"
                  />
                ) : todayEvents.length === 0 ? (
                  <div className="h-48 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-500 italic text-xs font-sans">
                    No meetings scheduled for today. Clean calendar!
                  </div>
                ) : (
                  <div className="relative border-l border-gradient-timeline ml-4 pl-6 space-y-6">
                    <style jsx global>{`
                      .border-gradient-timeline {
                        border-image: linear-gradient(to bottom, #7c3aed, #a855f7, transparent) 1 100%;
                      }
                    `}</style>
                    {todayEvents.map((event) => (
                      <div key={event.id} className="relative group">
                        <div className="absolute -left-[29.5px] top-1.5 w-3 h-3 rounded-full bg-[#03060b] border-2 border-primary group-hover:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                        
                        <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-950/15 hover:bg-zinc-950/30 space-y-3 shadow-md glass-panel-hover">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wider ${getMeetingTypeBadgeColor(event.meetingType)}`}>
                                  {event.meetingType}
                                </span>
                                {event.isConflict && (
                                  <span className="px-2 py-0.5 border border-red-pink/20 bg-red-pink/10 text-red-pink text-[9px] font-bold rounded uppercase tracking-wider animate-pulse glow-rose">
                                    Conflict
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-zinc-100 mt-1.5">{event.title}</h4>
                            </div>
                            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl shrink-0 h-fit font-mono">
                              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {event.description && (
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans">{event.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/[0.04] text-[10px] text-zinc-500 font-sans">
                            {event.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                {event.location}
                              </span>
                            )}
                            {event.meetingUrl && (
                              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-bold transition-colors">
                                <Video className="w-3.5 h-3.5 text-primary" />
                                Join Call
                              </a>
                            )}
                            {event.attendees && (event.attendees as string[]).length > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-zinc-600" />
                                {(event.attendees as string[]).length} Participants
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. UPCOMING agenda */}
            {activeTab === 'upcoming' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Upcoming Agenda</h3>
                  <span className="text-xs text-zinc-500 font-bold font-mono">{upcomingEvents.length} items</span>
                </div>

                {isEventsLoading ? (
                  <PageLoader
                    text="Syncing upcoming agenda..."
                    subtitle="Loading your next scheduled meetings..."
                    minHeight="min-h-[250px]"
                  />
                ) : upcomingEvents.length === 0 ? (
                  <div className="h-48 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-500 italic text-xs font-sans">
                    No upcoming meetings scheduled.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="glass-panel p-5 rounded-2xl border border-white/5 bg-card/20 hover:bg-card/45 transition-all flex flex-col justify-between glass-panel-hover"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase tracking-wider ${getMeetingTypeBadgeColor(event.meetingType)}`}>
                              {event.meetingType}
                            </span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono">
                              {formatCountdown(event.startTime)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-200 truncate">{event.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans max-h-12 overflow-hidden truncate">
                            {event.description || '(No description provided)'}
                          </p>
                        </div>

                        <div className="border-t border-white/[0.04] pt-4 mt-4 flex flex-col gap-2.5 text-[10px] text-zinc-500 font-sans">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            {event.meetingUrl && (
                              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-bold flex items-center gap-1 transition-colors">
                                <Video className="w-3.5 h-3.5" />
                                Call Link
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. INTERVIEW TRACKING */}
            {activeTab === 'interviews' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Candidate Recruitment</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-sans">Isolated recruitment slots and candidate participant details.</p>
                  </div>
                  <span className="text-xs text-zinc-500 font-bold uppercase font-mono">{interviewEvents.length} interviews</span>
                </div>

                {isEventsLoading ? (
                  <div className="overflow-x-auto border border-white/5 bg-card/30 rounded-2xl shadow-inner">
                    <table className="w-full text-left text-xs font-sans text-zinc-350 border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/40 font-mono">
                          <th className="py-4 px-5">Candidate / Interview Title</th>
                          <th className="py-4 px-5">Date & Time</th>
                          <th className="py-4 px-5">Participants</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={5} className="py-12">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Loader size="md" />
                              <span className="text-xs text-zinc-500 font-medium font-sans animate-pulse">Syncing interviews...</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : interviewEvents.length === 0 ? (
                  <div className="h-48 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-500 italic text-xs font-sans">
                    No candidate interviews tracked.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-white/5 bg-card/30 rounded-2xl shadow-inner">
                    <table className="w-full text-left text-xs font-sans text-zinc-350 border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/40 font-mono">
                          <th className="py-4 px-5">Candidate / Interview Title</th>
                          <th className="py-4 px-5">Date & Time</th>
                          <th className="py-4 px-5">Participants</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {interviewEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-zinc-950/20 transition-colors">
                            <td className="py-4 px-5 font-bold text-zinc-200">
                              {event.title}
                            </td>
                            <td className="py-4 px-5 font-mono text-zinc-400">
                              {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-5 truncate max-w-xs text-zinc-500 font-sans">
                              {event.attendees ? (event.attendees as string[]).join(', ') : 'None'}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`px-2.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(event.status)}`}>
                                {event.status}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              {event.meetingUrl && (
                                <a
                                  href={event.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:text-primary-hover font-bold inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  Call Link
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. CONFLICT DASHBOARD */}
            {activeTab === 'conflicts' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Collision search tool */}
                <div className="space-y-6 lg:col-span-1 font-sans">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Collision Search</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Validate range overlaps prior to scheduling.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Start Date/Time</label>
                      <input
                        type="datetime-local"
                        value={conflictStart}
                        onChange={(e) => setConflictStart(e.target.value)}
                        className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-4 rounded-2xl outline-none focus:border-primary font-mono transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">End Date/Time</label>
                      <input
                        type="datetime-local"
                        value={conflictEnd}
                        onChange={(e) => setConflictEnd(e.target.value)}
                        className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-4 rounded-2xl outline-none focus:border-primary font-mono transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleCheckConflict}
                      disabled={conflictCheckMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-hover text-xs font-bold text-white rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all duration-300 cursor-pointer disabled:opacity-50 border border-primary/20 active:scale-[0.98] font-mono"
                    >
                      <ButtonLoader show={conflictCheckMutation.isPending}>
                        <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
                        Check Schedule Conflict
                      </ButtonLoader>
                    </button>
                  </div>

                  {conflictCheckResult && (
                    <div className={`p-4 border rounded-2xl space-y-2.5 text-xs ${conflictCheckResult.hasConflict ? 'bg-red-pink/10 border-red-pink/20 text-red-pink shadow-[0_0_12px_rgba(244,63,94,0.15)] glow-rose' : 'bg-royal-blue/10 border-royal-blue/20 text-royal-blue shadow-[0_0_12px_rgba(37,99,235,0.15)] glow-sky'}`}>
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {conflictCheckResult.hasConflict ? 'Collision Detected!' : 'Schedule Clear!'}
                      </div>
                      <p className="font-semibold text-zinc-300">Found {conflictCheckResult.conflictsCount} overlapping events.</p>
                      {conflictCheckResult.overlappingEvents.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1.5 mt-2 font-medium">
                          {conflictCheckResult.overlappingEvents.map((evt) => (
                            <li key={evt.id}>
                              {evt.title} <span className="text-[10px] text-red-pink font-mono">({evt.meetingType})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Overlap timeline warning list */}
                <div className="space-y-6 lg:col-span-2 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Active Conflicts</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-sans font-medium">Identified overlapping times in your calendar.</p>
                  </div>

                  {isEventsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader size="md" />
                      <span className="text-xs text-zinc-500 font-medium font-sans animate-pulse">Analyzing conflicts...</span>
                    </div>
                  ) : conflictEvents.length === 0 ? (
                    <div className="h-48 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-500 italic text-xs font-sans">
                      No active collisions. Perfect calendar schedule!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                      {conflictEvents.map((evt) => (
                        <div key={evt.id} className="p-4 bg-red-pink/[0.01] border border-red-pink/20 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-inner hover:border-red-pink/35 transition-colors">
                          <div>
                            <span className="px-2 py-0.5 bg-red-pink/10 text-red-pink text-[8px] font-bold rounded uppercase tracking-wider animate-pulse border border-red-pink/20 font-mono">
                              Collision
                            </span>
                            <h4 className="font-bold text-zinc-200 mt-1.5">{evt.title}</h4>
                            <p className="text-zinc-500 font-mono mt-0.5 text-[10px]">
                              {new Date(evt.startTime).toLocaleDateString()} {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-[9px] font-extrabold text-red-pink uppercase tracking-wider border border-red-pink/20 px-2.5 py-1 rounded-xl bg-red-pink/5 font-mono">
                            {evt.meetingType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 5. AVAILABILITY SUGGESTION */}
            {activeTab === 'availability' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Parameters inputs */}
                <div className="space-y-5 lg:col-span-1 font-sans">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-widest font-mono">Availability Filters</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Filter preferences to identify available slots.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Start Date</label>
                        <input
                          type="date"
                          value={slotDateStart}
                          onChange={(e) => setSlotDateStart(e.target.value)}
                          className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-3.5 rounded-2xl outline-none focus:border-primary transition-colors font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">End Date</label>
                        <input
                          type="date"
                          value={slotDateEnd}
                          onChange={(e) => setSlotDateEnd(e.target.value)}
                          className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-3.5 rounded-2xl outline-none focus:border-primary transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Meeting Duration</label>
                      <select
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                        className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3.5 px-4 rounded-2xl outline-none focus:border-primary cursor-pointer transition-colors"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={120}>2 Hours</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Work Start (Hr)</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={slotWorkStart}
                          onChange={(e) => setSlotWorkStart(Number(e.target.value))}
                          className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-3.5 rounded-2xl outline-none focus:border-primary font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Work End (Hr)</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={slotWorkEnd}
                          onChange={(e) => setSlotWorkEnd(Number(e.target.value))}
                          className="w-full bg-[#050816] border border-white/5 text-xs text-zinc-300 py-3 px-3.5 rounded-2xl outline-none focus:border-primary font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSuggestSlots}
                      disabled={suggestSlotsMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-hover text-xs font-bold text-white rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all duration-300 cursor-pointer disabled:opacity-50 border border-primary/20 active:scale-[0.98] font-mono"
                    >
                      <ButtonLoader show={suggestSlotsMutation.isPending}>
                        <Search className="w-3.5 h-3.5 text-white shrink-0" />
                        Search Available Slots
                      </ButtonLoader>
                    </button>
                  </div>
                </div>

                {/* Suggestions slot list outputs */}
                <div className="space-y-6 lg:col-span-2 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Ranked Available Slots</h3>
                    <p className="text-xs text-zinc-550 mt-0.5 font-sans font-medium">Suggested slots sorted with morning preferences.</p>
                  </div>

                  {suggestedSlots.length === 0 ? (
                    <div className="h-48 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-550 italic text-xs font-sans">
                      Search availability parameters to generate slot timelines.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                      {suggestedSlots.map((slot) => {
                        const dateObj = new Date(slot.startTime);
                        const endObj = new Date(slot.endTime);
                        return (
                          <div
                            key={slot.startTime}
                            className="p-4 bg-zinc-950/15 border border-white/5 hover:border-primary/30 rounded-2xl flex items-center justify-between gap-4 text-xs transition-all duration-300 hover:bg-zinc-950/30"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border font-mono ${slot.ranking === 1 ? 'bg-royal-blue/10 text-royal-blue border-royal-blue/25 glow-sky' : slot.ranking === 2 ? 'bg-primary/10 text-primary border-primary/20 glow-brand' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                                {slot.ranking}
                              </span>
                              <div>
                                <span className="font-bold text-zinc-200 block font-sans">
                                  {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-zinc-500 block mt-0.5 font-mono text-[10px]">
                                  {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => copySlotText(slot)}
                              className="px-3.5 py-2 rounded-xl border border-white/5 hover:bg-zinc-900 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-98 font-mono"
                            >
                              {copiedSlot === slot.startTime ? (
                                <>
                                  <Check className="w-3 text-emerald-450 shrink-0" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 shrink-0" />
                                  Copy Slot
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>

      </div>
    </SidebarLayout>
  );
}
