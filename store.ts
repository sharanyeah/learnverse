
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, CourseSection, Message, Flashcard, PracticeQuestion } from './types';

interface TutorState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isEnriching: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspaceId: (id: string) => void;
  setIsEnriching: (status: boolean) => void;
  addWorkspace: (ws: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: '',
      isEnriching: false,
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      
      setIsEnriching: (status) => set({ isEnriching: status }),
      
      addWorkspace: (ws) => set((state) => ({ 
        workspaces: [ws, ...state.workspaces],
        activeWorkspaceId: ws.fileInfo.id
      })),
      
      updateWorkspace: (id, updates) => set((state) => ({
        workspaces: state.workspaces.map(ws => ws.fileInfo.id === id ? { ...ws, ...updates } : ws)
      })),
      
      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find(w => w.fileInfo.id === activeWorkspaceId);
      }
    }),
    {
      name: 'deeptutor-v4-storage',
      partialize: (state) => ({ workspaces: state.workspaces, activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
);
