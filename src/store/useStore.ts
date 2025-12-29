import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LCAInput {
  materialType: string;
  customMaterial?: string;
  route: 'virgin' | 'recycled' | 'mixed';
  recycledPercentage?: number;
  electricityKwh: number;
  fuelType: string;
  fuelMj: number;
  transportDistance: number;
  transportMode: string;
  recyclePercent: number;
  reusePercent: number;
  landfillPercent: number;
}

export interface LCAResult {
  id: string;
  _id?: string;
  name: string;
  input: LCAInput;
  carbonEmissions: number;
  energyConsumed: number;
  waterUse: number;
  circularityPercent: number;
  recommendations: string[];
  timestamp: Date;
  batchData?: any[];
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // LCA Data
  currentInput: Partial<LCAInput>;
  setCurrentInput: (input: Partial<LCAInput>) => void;
  clearCurrentInput: () => void;

  // Results
  results: LCAResult[];
  currentResult: LCAResult | null;
  setCurrentResult: (result: LCAResult) => void;
  addResult: (result: LCAResult) => void;
  removeResult: (id: string) => void;

  // Comparison
  selectedScenarios: string[];
  setSelectedScenarios: (ids: string[]) => void;

  // UI State
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // LCA Data
      currentInput: {},
      setCurrentInput: (input) => {
        try {
          set((state) => ({ 
            currentInput: { ...state.currentInput, ...input } 
          }));
        } catch (error) {
          console.warn('Storage quota exceeded, clearing old data');
          set({ results: [], currentInput: input });
        }
      },
      clearCurrentInput: () => set({ currentInput: {} }),

      // Results
      results: [],
      currentResult: null,
      setCurrentResult: (result) => set({ currentResult: result }),
      addResult: (result) => 
        set((state) => {
          const maxResults = 10;
          const newResults = state.results.length >= maxResults 
            ? [...state.results.slice(1), result]
            : [...state.results, result];
          return { 
            results: newResults,
            currentResult: result
          };
        }),
      removeResult: (id) => 
        set((state) => ({ 
          results: state.results.filter(r => r.id !== id),
          currentResult: state.currentResult?.id === id ? null : state.currentResult
        })),

      // Comparison
      selectedScenarios: [],
      setSelectedScenarios: (ids) => set({ selectedScenarios: ids }),

      // UI State
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'lca-tool-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        results: state.results.slice(-5),
        darkMode: state.darkMode,
      }),
    }
  )
);