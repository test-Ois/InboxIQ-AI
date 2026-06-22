'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, TaskDto, TaskStatus, TaskPriority } from '@/services/api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Layers,
  CheckSquare
} from 'lucide-react';

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
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

const formatDueDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TasksPage() {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 6;

  // 1. Fetch Paginated & Filtered Tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', page, search, statusTab, priorityFilter],
    queryFn: () =>
      apiService.getTasks({
        page,
        limit,
        search: search || undefined,
        status: statusTab === 'ALL' ? undefined : statusTab,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const totalPages = data?.meta.totalPages || 0;

  // 2. Fetch Tasks Statistics for widgets/completion progress
  const { data: stats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: apiService.getTaskStats,
  });

  // 3. Mutations for inline state changes
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof apiService.updateTask>[1] }) =>
      apiService.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task-stats'] });

      // Snapshot the previous state
      const previousTasks = queryClient.getQueryData(['tasks', page, search, statusTab, priorityFilter]);

      // Optimistically update the task status in the cache
      queryClient.setQueryData(
        ['tasks', page, search, statusTab, priorityFilter],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((task: TaskDto) =>
              task.id === id ? { ...task, ...updates } : task
            ),
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['tasks', page, search, statusTab, priorityFilter],
          context.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task-stats'] });

      const previousTasks = queryClient.getQueryData(['tasks', page, search, statusTab, priorityFilter]);

      // Optimistically remove from list
      queryClient.setQueryData(
        ['tasks', page, search, statusTab, priorityFilter],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.filter((task: TaskDto) => task.id !== id),
          };
        }
      );

      return { previousTasks };
    },
    onError: (err, id, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['tasks', page, search, statusTab, priorityFilter],
          context.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });

  const handleToggleComplete = (task: TaskDto) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateMutation.mutate({
      id: task.id,
      updates: { status: newStatus },
    });
  };

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    updateMutation.mutate({
      id,
      updates: { status: newStatus },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-450 shadow-[0_0_8px_rgba(244,63,94,0.1)]';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-450 shadow-[0_0_8px_rgba(249,115,22,0.1)]';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-450';
      case 'LOW':
        return 'bg-zinc-500/10 border-zinc-550/30 text-zinc-400';
      default:
        return 'bg-zinc-500/10 border-zinc-550/30 text-zinc-400';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    const isCompleted = status === 'COMPLETED';
    const isInProgress = status === 'IN_PROGRESS';
    return (
      <div className={cn(
        "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300",
        isCompleted ? "bg-violet-600 border-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.4)] text-white" : 
        isInProgress ? "border-amber-500 text-amber-500 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]" :
        "border-zinc-700 bg-zinc-950 hover:border-violet-500 hover:bg-violet-500/5 text-transparent hover:text-violet-400/50"
      )}>
        {isCompleted ? (
          <motion.svg
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-3.5 h-3.5 stroke-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : isInProgress ? (
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        ) : null}
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Panel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="relative p-8 rounded-3xl overflow-hidden glass-panel border border-white/5 bg-gradient-to-br from-[#0c0c20] via-[#050816]/95 to-[#0b1020]"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse glow-brand" />
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                  AI Action-Item Scan
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-sans">
                Task Intelligence Board
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl font-sans leading-relaxed">
                Review, process, and execute action items automatically extracted from incoming emails by our AI analysis models.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-2xl border border-white/5 shrink-0">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="pr-4 text-left font-sans">
                <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Extraction Rate</p>
                <p className="text-xs font-bold text-zinc-300">Real-time Parsing</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Statistics Widgets */}
        {stats && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          >
            <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-b-2 border-b-zinc-800 glass-panel-hover">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Total Extracted</span>
              <span className="text-3xl font-black text-zinc-150 mt-2 block tracking-tight">
                {stats.metrics.totalCreated}
              </span>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-b-2 border-b-violet-500/70 glow-brand glass-panel-hover">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider font-mono">Completion Rate</span>
              <span className="text-3xl font-black text-violet-350 mt-2 block tracking-tight">
                {stats.metrics.totalCompleted} <span className="text-xs font-bold text-zinc-500">({stats.metrics.completionPercentage}%)</span>
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-b-2 border-b-rose-500/70 glow-rose glass-panel-hover">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">Overdue Alerts</span>
              <span className="text-3xl font-black text-rose-300 mt-2 block tracking-tight">
                {stats.metrics.overdueCount}
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-b-2 border-b-emerald-500/70 glow-emerald glass-panel-hover">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Extracted Today</span>
              <span className="text-3xl font-black text-emerald-350 mt-2 block tracking-tight">
                {stats.metrics.aiGeneratedToday}
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Filter bar console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/5 bg-[#0B1020]/25">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search extracted task titles or action instructions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#050816]/50 border border-white/5 focus:border-violet-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-200 outline-none transition-all placeholder:text-zinc-650 focus:ring-1 focus:ring-violet-500/20 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/5 px-3.5 py-2.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-bold font-mono">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 text-xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs Bar Controller */}
        <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`px-6 py-3.5 text-xs font-bold tracking-widest border-b-2 uppercase transition-all cursor-pointer whitespace-nowrap ${
                statusTab === tab
                  ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/10'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Task Board List Grid */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 animate-pulse h-48 shimmer-bg" />
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel p-12 rounded-2xl border border-rose-500/20 text-center text-rose-400 font-bold font-sans">
              Failed to load task intelligence board. Please try again.
            </div>
          ) : !data?.tasks || data.tasks.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center gap-5">
              <div className="p-4.5 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-550">
                <CheckCircle className="w-10 h-10 text-violet-400/80 animate-pulse glow-brand" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-zinc-200 text-lg">Inbox Actions Completed</p>
                <p className="text-xs text-zinc-500 max-w-sm font-sans mx-auto leading-relaxed">
                  No action items identified. Future task capture lists will populate when new email notifications sync.
                </p>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {data.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between hover:border-zinc-700/60 transition-all duration-350 relative overflow-hidden group shadow-md glass-panel-hover ${
                      task.status === 'COMPLETED' ? 'opacity-55' : ''
                    }`}
                  >
                    <div className="space-y-4 flex-1">
                      {/* Title block with custom checkboxes */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className="cursor-pointer transition-transform hover:scale-105 shrink-0 mt-0.5"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <h3 className={`font-bold text-zinc-200 text-sm leading-snug group-hover:text-white transition-colors truncate ${
                            task.status === 'COMPLETED' ? 'line-through text-zinc-500 group-hover:text-zinc-550' : ''
                          }`}>
                            {task.title}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-md uppercase tracking-wider shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Description body */}
                      <p className={`text-xs text-zinc-400 leading-relaxed font-sans line-clamp-3 ${
                        task.status === 'COMPLETED' ? 'text-zinc-600' : ''
                      }`}>
                        {task.description || 'No detailed instructions provided.'}
                      </p>

                      {/* AI Confidence indicators */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                          <span>Extraction Confidence</span>
                          <span>{Math.round(task.confidenceScore * 100)}%</span>
                        </div>
                        <div className="h-1 bg-zinc-950 border border-white/[0.02] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${task.confidenceScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata tools */}
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-sans">
                      <div className="flex items-center gap-3 text-zinc-500">
                        {/* Due Date Indicator alerts */}
                        {task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime() && task.status !== 'COMPLETED' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 border border-rose-500/25 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-lg glow-rose animate-pulse font-sans">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            <span>{formatDueDate(task.dueDate)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-450 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            <span>{formatDueDate(task.dueDate)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 font-semibold text-zinc-650">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Dropdown status swapper */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="bg-zinc-950 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-zinc-350 outline-none cursor-pointer focus:border-violet-500/40"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>

                        {/* Delete action trigger */}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 rounded-lg border border-white/5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Email reference context */}
                    {task.email && (
                      <div className="mt-3.5 px-3 py-2 rounded-xl bg-zinc-950/40 border border-white/[0.02] flex items-center justify-between text-[10px] text-zinc-500 font-sans">
                        <span className="truncate max-w-[200px]">
                          Context: <strong className="text-zinc-400 font-semibold">{task.email.subject}</strong>
                        </span>
                        <span className="text-[9px] bg-zinc-900 border border-white/5 text-zinc-450 px-2 py-0.5 rounded-md truncate max-w-[120px] font-bold font-mono">
                          {task.email.sender.replace(/<.*>/, '')}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
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
      </div>
    </SidebarLayout>
  );
}
