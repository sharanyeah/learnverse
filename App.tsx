
import React, { useRef, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { useTutorStore } from './store';
import Sidebar from './components/Sidebar';
import ResourceViewer from './components/ResourceViewer';
import { getDocumentStructure, enrichCoreContent, enrichAuxiliaryContent, initializeAI, AIProvider } from './services/aiService';
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
    getActiveWorkspace,
    apiProvider,
    apiKey,
    setApiConfig
  } = useTutorStore();

  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempProvider, setTempProvider] = useState<AIProvider>('openai');
  const [tempApiKey, setTempApiKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeWorkspace = getActiveWorkspace();

  useEffect(() => {
    if (!apiProvider || !apiKey) {
      setShowSettings(true);
    } else {
      initializeAI({ provider: apiProvider, apiKey });
    }
  }, [apiProvider, apiKey]);

  const handleSaveSettings = () => {
    if (tempApiKey.trim()) {
      setApiConfig(tempProvider, tempApiKey.trim());
      initializeAI({ provider: tempProvider, apiKey: tempApiKey.trim() });
      setShowSettings(false);
    }
  };

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
    const section = activeWorkspace.sections[idx];
    if ((!section.content || !section.mindmap) && !enrichMutation.isPending) {
      enrichMutation.mutate({ ws: activeWorkspace, index: idx });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-slate-50 selection:text-slate-900">
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-12 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <i className="fas fa-key text-2xl"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">API Configuration</h2>
                <p className="text-sm text-slate-500 font-medium">Choose your AI provider and enter your API key</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-4 block">Select Provider</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTempProvider('openai')}
                    className={`p-8 rounded-[2rem] border-2 transition-all text-left ${
                      tempProvider === 'openai'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tempProvider === 'openai' ? 'bg-white/10' : 'bg-slate-50'
                      }`}>
                        <i className="fas fa-robot text-xl"></i>
                      </div>
                      <span className="font-black text-lg">OpenAI</span>
                    </div>
                    <p className={`text-xs ${tempProvider === 'openai' ? 'text-white/70' : 'text-slate-400'}`}>
                      GPT-4o, GPT-4o-mini models
                    </p>
                  </button>

                  <button
                    onClick={() => setTempProvider('gemini')}
                    className={`p-8 rounded-[2rem] border-2 transition-all text-left ${
                      tempProvider === 'gemini'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tempProvider === 'gemini' ? 'bg-white/10' : 'bg-slate-50'
                      }`}>
                        <i className="fas fa-sparkles text-xl"></i>
                      </div>
                      <span className="font-black text-lg">Gemini</span>
                    </div>
                    <p className={`text-xs ${tempProvider === 'gemini' ? 'text-white/70' : 'text-slate-400'}`}>
                      Gemini 2.0 Flash, Thinking models
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-4 block">API Key</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder={`Enter your ${tempProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key...`}
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-mono text-sm focus:bg-white focus:border-slate-900 transition-all outline-none"
                />
                <p className="text-xs text-slate-400 mt-4 ml-2">
                  {tempProvider === 'openai' ? (
                    <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:underline">platform.openai.com</a></>
                  ) : (
                    <>Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:underline">aistudio.google.com</a></>
                  )}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={!tempApiKey.trim()}
                  className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Save Configuration
                </button>
                {apiProvider && apiKey && (
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-10 py-6 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!activeWorkspaceId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
          <div className="absolute top-8 right-8">
            <button
              onClick={() => {
                setTempProvider(apiProvider || 'openai');
                setTempApiKey(apiKey || '');
                setShowSettings(true);
              }}
              className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-lg"
              title="API Settings"
            >
              <i className="fas fa-cog text-xl"></i>
            </button>
          </div>

          <div className="space-y-4">
            <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-8">
              <i className="fas fa-brain text-4xl"></i>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900">DeepTutor <span className="text-slate-600">V4</span></h1>
            <p className="text-slate-400 font-medium text-xl max-w-md mx-auto">Localized Neural Grounding for Academic Mastery.</p>
            {apiProvider && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {apiProvider === 'openai' ? 'OpenAI' : 'Gemini'} Connected
                </span>
              </div>
            )}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 p-24 rounded-[4rem] cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group relative overflow-hidden"
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.ppt,.pptx" />
            <div className="relative z-10 flex flex-col items-center">
              <i className="fas fa-file-import text-slate-300 group-hover:text-slate-600 transition-colors text-6xl mb-8"></i>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">{attachment ? attachment.name : 'Ingest Knowledge Source'}</p>
            </div>
          </div>

          <button
            disabled={!attachment || initMutation.isPending || !apiProvider || !apiKey}
            onClick={() => attachment && initMutation.mutate(attachment)}
            className="w-full max-w-sm h-20 bg-slate-950 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-3xl shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed transform active:scale-95"
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
