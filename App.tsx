
import React, { useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { useTutorStore } from './store';
import Sidebar from './components/Sidebar';
import ResourceViewer from './components/ResourceViewer';
import { getDocumentStructure, enrichCoreContent, enrichAuxiliaryContent } from './services/geminiService';
import { FileAttachment, CourseSection, Workspace } from './types';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspaceId, 
    addWorkspace, 
    updateWorkspace, 
    setActiveWorkspaceId,
    setIsEnriching,
    getActiveWorkspace
  } = useTutorStore();
  
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWorkspace = getActiveWorkspace();

  const initMutation = useMutation({
    mutationFn: async (file: FileAttachment) => {
      const skeleton = await getDocumentStructure(file);
      
      const sections: CourseSection[] = skeleton.map((s, idx) => ({
        ...s,
        id: crypto.randomUUID(),
        status: idx === 0 ? 'in-progress' : 'locked',
        mastery: 0,
        content: '',
        keyTerms: [],
        formulas: [],
        mindmap: '',
        summary: s.summary || '',
        title: s.title || 'Untitled Unit',
        sourceReference: s.sourceReference || '',
        chatHistory: [],
        flashcards: [],
        practiceQuestions: []
      } as CourseSection));

      const newWs: Workspace = {
        fileInfo: { id: crypto.randomUUID(), name: file.name, type: 'pdf', uploadDate: new Date().toISOString() },
        subject: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        sections,
        activeSectionIndex: 0,
        attachment: file
      };
      return newWs;
    },
    onSuccess: (newWs) => {
      addWorkspace(newWs);
      enrichMutation.mutate({ ws: newWs, index: 0 });
    }
  });

  const enrichMutation = useMutation({
    mutationFn: async ({ ws, index }: { ws: Workspace, index: number }) => {
      setIsEnriching(true);
      const section = ws.sections[index];
      
      // Phase 1: Core Narrative
      const core = await enrichCoreContent(section, ws.attachment!);
      
      const currentWs = useTutorStore.getState().workspaces.find(w => w.fileInfo.id === ws.fileInfo.id);
      if (currentWs) {
        updateWorkspace(ws.fileInfo.id, {
          sections: currentWs.sections.map((s, idx) => 
            idx === index ? { ...s, ...core } : s
          )
        });
      }

      // Phase 2: Auxiliary Logic (Mindmap/MCQs/Flashcards)
      const aux = await enrichAuxiliaryContent(section, ws.attachment!);
      return { aux, index, workspaceId: ws.fileInfo.id };
    },
    onSuccess: ({ aux, index, workspaceId }) => {
      const ws = useTutorStore.getState().workspaces.find(w => w.fileInfo.id === workspaceId);
      if (!ws) return;
      
      updateWorkspace(workspaceId, {
        sections: ws.sections.map((s, idx) => 
          idx === index ? { 
            ...s, 
            mindmap: aux.mindmap,
            practiceQuestions: aux.questions,
            flashcards: aux.flashcards
          } : s
        )
      });
      setIsEnriching(false);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachment({ data: base64, mimeType: file.type || 'application/pdf', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSection = (idx: number) => {
    if (!activeWorkspace) return;
    updateWorkspace(activeWorkspace.fileInfo.id, { activeSectionIndex: idx });
    // Trigger enrichment if content or mindmap hasn't been generated yet
    const section = activeWorkspace.sections[idx];
    if ((!section.content || !section.mindmap) && !enrichMutation.isPending) {
      enrichMutation.mutate({ ws: activeWorkspace, index: idx });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-indigo-50 selection:text-indigo-900">
      {!activeWorkspaceId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
          <div className="space-y-4">
            <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-8">
              <i className="fas fa-brain text-4xl"></i>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900">DeepTutor <span className="text-indigo-600">V4</span></h1>
            <p className="text-slate-400 font-medium text-xl max-w-md mx-auto">Localized Neural Grounding for Academic Mastery.</p>
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 p-24 rounded-[4rem] cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all group relative overflow-hidden"
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <div className="relative z-10 flex flex-col items-center">
              <i className="fas fa-file-import text-slate-300 group-hover:text-indigo-500 transition-colors text-6xl mb-8"></i>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">{attachment ? attachment.name : 'Ingest Knowledge Source'}</p>
            </div>
          </div>
          
          <button 
            disabled={!attachment || initMutation.isPending}
            onClick={() => attachment && initMutation.mutate(attachment)}
            className="w-full max-w-sm h-20 bg-slate-950 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-3xl shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed transform active:scale-95"
          >
            {initMutation.isPending ? 'Deciphering Neural Weights...' : 'Initialize Deep Study'}
          </button>
        </div>
      ) : (
        <>
          <Sidebar 
            workspaces={workspaces} 
            activeWorkspaceId={activeWorkspaceId} 
            onSelectWorkspace={setActiveWorkspaceId} 
            onNewFile={() => setActiveWorkspaceId('')}
            onSelectSection={handleSelectSection}
            onClearAll={() => {
              if (confirm("Purge all academic archives?")) {
                useTutorStore.getState().setWorkspaces([]);
                setActiveWorkspaceId('');
              }
            }}
          />
          {activeWorkspace && (
            <ResourceViewer 
              activeWorkspace={activeWorkspace} 
              onUpdateWorkspace={(updates) => updateWorkspace(activeWorkspace.fileInfo.id, updates)} 
              onNextSection={() => {
                const nextIdx = activeWorkspace.activeSectionIndex + 1;
                if (nextIdx < activeWorkspace.sections.length) {
                  handleSelectSection(nextIdx);
                }
              }}
              isEnriching={enrichMutation.isPending}
            />
          )}
        </>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
