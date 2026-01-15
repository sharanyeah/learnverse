
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Workspace, Flashcard, Message, CourseSection, PracticeQuestion, Concept } from '../types';
import ChatInterface from './ChatInterface';
import MermaidDiagram from './MermaidDiagram';
import FlashcardsView from './FlashcardsView';
import { ExamRoom } from './ExamRoom';
import KnowledgeGraph from './KnowledgeGraph';
import StudyPlanner from './StudyPlanner';

interface ResourceViewerProps {
  activeWorkspace: Workspace;
  onUpdateWorkspace: (w: Partial<Workspace>) => void;
  onNextSection: () => void;
  isEnriching: boolean;
}

// Using explicit default function export to ensure module resolution works correctly in all environments
export default function ResourceViewer({ 
  activeWorkspace, 
  onUpdateWorkspace, 
  onNextSection, 
  isEnriching 
}: ResourceViewerProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'mindmap' | 'tutor' | 'recall' | 'verify' | 'strategy'>('learn');
  const sectionIndex = activeWorkspace.activeSectionIndex;
  const section = activeWorkspace.sections[sectionIndex];

  if (!section) return null;

  const isCoreEnriched = !!section.content;
  const isAuxEnriched = !!section.mindmap;

  const tabs = [
    { id: 'learn', label: 'Knowledge Base', icon: 'fa-book-open' },
    { id: 'mindmap', label: 'Logic Map', icon: 'fa-sitemap' },
    { id: 'tutor', label: 'Socratic Tutor', icon: 'fa-brain' },
    { id: 'recall', label: 'Retention', icon: 'fa-clone' },
    { id: 'verify', label: 'Exam Room', icon: 'fa-certificate' },
    { id: 'strategy', label: 'Academic Strategy', icon: 'fa-chess-king' },
  ];

  const updateSection = (updates: Partial<CourseSection>) => {
    onUpdateWorkspace({
      sections: activeWorkspace.sections.map((s, idx) => idx === sectionIndex ? { ...s, ...updates } : s)
    });
  };

  const handleUpdateFlashcards = (cards: Flashcard[]) => {
    updateSection({ flashcards: cards });
  };

  const handleUpdateFlashcardStatus = (id: string, status: 'learning' | 'mastered') => {
    const updated = section.flashcards.map(c => c.id === id ? { ...c, masteryStatus: status } : c);
    updateSection({ flashcards: updated });
  };

  const handleUpdateQuestions = (qs: PracticeQuestion[]) => {
    updateSection({ practiceQuestions: qs });
  };

  const handleAddMessage = (msg: Message) => {
    updateSection({ chatHistory: [...section.chatHistory, msg] });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans">
      <div className="px-12 pt-14 pb-8 border-b border-slate-100 z-20">
        <div className="flex justify-between items-start mb-10 max-w-7xl mx-auto w-full">
          <div className="flex-1 min-w-0 pr-10">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-sm">Unit {sectionIndex + 1}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.sourceReference}</span>
              {isEnriching && <span className="text-[9px] font-black text-indigo-500 animate-pulse uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Neural Synthesis...</span>}
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              {section.title}
            </h2>
          </div>
          <button 
            onClick={onNextSection}
            className="px-8 py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-4"
          >
            Advance Goal
            <i className="fas fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <div className="flex gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl w-fit max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-950 shadow-md border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fas ${tab.icon} text-[10px]`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {!isCoreEnriched ? (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-[#fdfdfd]">
            <div className="relative mb-12">
              <div className="w-32 h-32 border-4 border-slate-100 rounded-[2.5rem] animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase text-indigo-500 tracking-[0.6em] animate-pulse">Deep Knowledge Retrieval</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Deciphering Core Concepts</h3>
              <p className="text-[13px] text-slate-400 max-w-sm mx-auto leading-[1.6] font-medium">
                The DeepTutor Engine is generating your academic unit overview.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'learn' && (
              <div className="h-full overflow-y-auto p-12 custom-scrollbar bg-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 py-8 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="lg:col-span-8 space-y-16">
                    <section className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                      <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6">Thesis Abstract</h4>
                      <p className="text-2xl text-slate-950 leading-[1.35] font-black tracking-tight italic">"{section.summary}"</p>
                    </section>
                    <section className="space-y-12">
                       <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-3">Academic Narrative</h4>
                       <div className="font-serif text-[19px] text-slate-800 leading-[1.8] space-y-10 max-w-[72ch] prose prose-slate">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {section.content}
                        </ReactMarkdown>
                       </div>
                    </section>
                  </div>
                  <div className="lg:col-span-4 space-y-12">
                    {section.keyTerms.length > 0 && (
                      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Core Lexicon</h5>
                        <div className="space-y-8">
                          {section.keyTerms.map((term, i) => (
                            <div key={i}>
                              <p className="font-black text-slate-900 text-[11px] mb-2 uppercase tracking-tight">{term.term}</p>
                              <p className="text-[13px] text-slate-500 font-medium">{term.definition}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {section.formulas.length > 0 && (
                      <section className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50">
                        <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">Extracted Axioms</h5>
                        <div className="space-y-8">
                          {section.formulas.map((formula, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-indigo-100">
                              <p className="text-[10px] font-black text-indigo-500 uppercase mb-2">{formula.label}</p>
                              <div className="text-sm overflow-x-auto">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {`$$${formula.expression}$$`}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mindmap' && (
              <div className="h-full bg-slate-50 flex flex-col p-12">
                 {!isAuxEnriched ? (
                   <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 p-12 text-center animate-pulse">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synthesizing Logic Graph...</p>
                   </div>
                 ) : (
                   <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-200/60 overflow-hidden shadow-2xl">
                      <div className="p-12 border-b border-slate-100">
                         <h3 className="text-xs font-black uppercase text-slate-900 tracking-[0.3em]">Architectural Dependency Graph</h3>
                      </div>
                      <div className="flex-1 p-12 flex items-center justify-center overflow-auto bg-[#fafafa]">
                         <MermaidDiagram chart={section.mindmap} />
                      </div>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'tutor' && (
              <ChatInterface 
                activeConcept={{ ...section, dependencies: [] } as Concept} 
                onUpdateMastery={(id, inc) => updateSection({ mastery: Math.min(100, section.mastery + inc) })} 
                messages={section.chatHistory}
                onAddMessage={handleAddMessage}
              />
            )}

            {activeTab === 'recall' && (
              <FlashcardsView 
                cards={section.flashcards}
                onAdd={(q, a) => handleUpdateFlashcards([...section.flashcards, { id: crypto.randomUUID(), question: q, answer: a, masteryStatus: 'learning' }])}
                onDelete={id => handleUpdateFlashcards(section.flashcards.filter(c => c.id !== id))}
                onUpdate={(id, q, a) => handleUpdateFlashcards(section.flashcards.map(c => c.id === id ? { ...c, question: q, answer: a } : c))}
                onApproveSuggestion={id => handleUpdateFlashcards(section.flashcards.map(c => c.id === id ? { ...c, isAiSuggested: false } : c))}
                onUpdateStatus={handleUpdateFlashcardStatus}
              />
            )}

            {activeTab === 'verify' && (
              <ExamRoom 
                questions={section.practiceQuestions} 
                activeSection={section}
                onUpdateQuestions={handleUpdateQuestions}
                onCorrect={() => updateSection({ mastery: Math.min(100, section.mastery + 2) })} 
              />
            )}

            {activeTab === 'strategy' && (
              <div className="h-full overflow-y-auto bg-slate-50 p-12 custom-scrollbar">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-12">
                    <KnowledgeGraph concepts={activeWorkspace.sections.map(s => ({ ...s, dependencies: [] } as Concept))} />
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Academic Velocity Stats</h4>
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="text-2xl font-black text-slate-900">{activeWorkspace.sections.filter(s => !!s.content).length}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Units Ingested</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-indigo-600">{section.mastery}%</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Local Mastery</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-slate-900">{section.flashcards.length}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Anchored Concepts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <StudyPlanner subject={activeWorkspace.subject} concepts={activeWorkspace.sections.map(s => ({ ...s, dependencies: [] } as Concept))} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
