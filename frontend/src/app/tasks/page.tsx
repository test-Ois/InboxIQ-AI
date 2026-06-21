'use client';

import SidebarLayout from '@/components/layout/sidebar-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, TaskDto, TaskStatus, TaskPriority } from '@/services/api';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';

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
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'LOW':
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-indigo-400" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />;
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'No Deadline';
    const date = new Date(dateStr);
    const diffTime = date.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due Today';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const totalPages = data?.meta?.totalPages || 1;

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-sans flex items-center gap-3">
              Task Intelligence Board
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                AI Extracted
              </span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Automatically capture, filter, and complete action items extracted from analyzed emails.
            </p>
          </div>
        </div>

        {/* Analytics mini grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Tasks</span>
              <span className="text-3xl font-bold text-zinc-200 mt-2">{stats.metrics.totalCreated}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed</span>
              <span className="text-3xl font-bold text-zinc-200 mt-2">
                {stats.metrics.totalCompleted} <span className="text-sm font-normal text-zinc-500">({stats.metrics.completionPercentage}%)</span>
              </span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Overdue Tasks</span>
              <span className="text-3xl font-bold text-red-400 mt-2">{stats.metrics.overdueCount}</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Generated Today</span>
              <span className="text-3xl font-bold text-indigo-400 mt-2">{stats.metrics.aiGeneratedToday}</span>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search task title or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0c0c0e]/80 border border-zinc-800 focus:border-indigo-500/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-2 bg-[#0c0c0e]/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-zinc-200 font-semibold outline-none cursor-pointer"
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

        {/* Tabs Bar */}
        <div className="flex border-b border-zinc-800">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`px-6 py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                statusTab === tab
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/10'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Task Board / List */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-5 w-1/3 bg-zinc-800 rounded" />
                    <div className="h-5 w-12 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="h-12 w-full bg-zinc-800 rounded" />
                  <div className="h-5 w-1/2 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel p-12 rounded-2xl border border-red-500/20 text-center text-red-400">
              Failed to load tasks. Please try again.
            </div>
          ) : !data?.tasks || data.tasks.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-zinc-800 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                <CheckCircle2 className="w-6 h-6 text-indigo-400/80" />
              </div>
              <div>
                <p className="font-semibold text-zinc-300">All clear! No tasks found</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Tasks are automatically extracted when new emails are synced and analyzed. Try syncing your inbox.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {data.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between hover:border-zinc-700/80 transition-all duration-150 relative overflow-hidden group ${
                      task.status === 'COMPLETED' ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className="cursor-pointer transition-transform hover:scale-105"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <h3 className={`font-bold text-zinc-100 text-base leading-snug ${
                            task.status === 'COMPLETED' ? 'line-through text-zinc-500' : ''
                          }`}>
                            {task.title}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Description */}
                      <p className={`text-sm text-zinc-400 leading-relaxed font-sans line-clamp-3 ${
                        task.status === 'COMPLETED' ? 'text-zinc-600' : ''
                      }`}>
                        {task.description || 'No description provided.'}
                      </p>

                      {/* Confidence Score Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                          <span>AI Confidence</span>
                          <span>{Math.round(task.confidenceScore * 100)}%</span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${task.confidenceScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-zinc-500">
                        {/* Due Date Indicator */}
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span className={task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime() && task.status !== 'COMPLETED' ? 'text-red-400' : ''}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                        
                        {/* Time marker */}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Dropdown status switcher */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="bg-[#0c0c0e] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 outline-none cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>

                        {/* Delete action */}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 rounded-lg border border-zinc-800/80 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Email context tooltip/indicator */}
                    {task.email && (
                      <div className="mt-3 px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate max-w-[200px]">
                          Email: <strong>{task.email.subject}</strong>
                        </span>
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {task.email.sender.replace(/<.*>/, '')}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pagination controls */}
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
    </SidebarLayout>
  );
}
