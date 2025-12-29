import { create } from 'zustand';

interface GlobalLoaderState {
  isLoading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useGlobalLoader = create<GlobalLoaderState>((set) => ({
  isLoading: false,
  message: 'Loading...',
  setLoading: (loading: boolean, message = 'Loading...') => 
    set({ isLoading: loading, message }),
}));