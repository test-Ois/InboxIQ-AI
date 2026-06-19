import { create } from 'zustand';

interface UIState {
  searchQuery: string;
  selectedLabel: string;
  selectedAccountId: string;
  currentPage: number;
  selectedEmailId: string | null;
  isDrawerOpen: boolean;
  
  setSearchQuery: (query: string) => void;
  setSelectedLabel: (label: string) => void;
  setSelectedAccountId: (accountId: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedEmailId: (id: string | null) => void;
  setIsDrawerOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  selectedLabel: '',
  selectedAccountId: '',
  currentPage: 1,
  selectedEmailId: null,
  isDrawerOpen: false,

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedLabel: (label) => set({ selectedLabel: label, currentPage: 1 }),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  resetFilters: () => set({ searchQuery: '', selectedLabel: '', selectedAccountId: '', currentPage: 1 }),
}));
