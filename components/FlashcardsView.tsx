
import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
  onAdd: (q: string, a: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, q: string, a: string) => void;
  onApproveSuggestion: (id: string) => void;
  onUpdateStatus: (id: string, status: 'learning' | 'mastered') => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ 
  cards, onAdd, onDelete, onUpdate, onApproveSuggestion, onUpdateStatus 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');

  const activeCards = cards.filter(c => {
    if (c.isAiSuggested) return false;
    if (filter === 'all') return true;
    return c.masteryStatus === filter;
  });

  const suggestedCards = cards.filter(c => c.isAiSuggested);
  
  useEffect(() => {
    if (activeCards.length > 0 && currentIndex >= activeCards.length) {
      setCurrentIndex(activeCards.length - 1);
    }
  }, [activeCards.length, currentIndex]);

  const currentCard = activeCards[currentIndex];

  const handleSave = () => {
    if (!q || !a) return;
    if (editId) onUpdate(editId, q, a);
    else onAdd(q, a);
    resetForm();
  };

  const resetForm = () => {
    setQ('');
    setA('');
    setEditId(null);
    setIsEditorOpen(false);
  };

  const openEdit = (card: Flashcard) => {
    setQ(card.question);
    setA(card.answer);
    setEditId(card.id);
    setIsEditorOpen(true);
  };

  const goToNext = () => {
    setIsFlipped(false);
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const markStatus = (id: string, status: 'learning' | 'mastered') => {
    onUpdateStatus(id, status);
    setTimeout(goToNext, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] overflow-y-auto custom-scrollbar p-12">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em]">Knowledge Persistence</h3>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Active Recall</h3>
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
            {(['all', 'learning', 'mastered'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentIndex(0); }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isEditorOpen && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h4 className="text-lg font-black mb-6 flex items-center gap-3">
              <i className="fas fa-pen-nib text-indigo-500"></i>
              {editId ? 'Revise Concept' : 'Anchor New Axiom'}
            </h4>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Prompt / Inquiry</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Define the core principle..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Intellectual Truth</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={a} onChange={e => setA(e.target.value)}
                  placeholder="The synthesis of the concept is..."
                />
              </div>
              <div className="flex gap-4">
                <button onClick={handleSave} className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl">Commit to Archive</button>
                <button onClick={resetForm} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Discard</button>
              </div>
            </div>
          </div>
        )}

        {suggestedCards.length > 0 && filter === 'all' && (
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-2 flex items-center gap-2">
              <i className="fas fa-magic"></i>
              Synthesized Proposals
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedCards.map(sc => (
                <div key={sc.id} className="bg-white p-6 rounded-[2rem] border border-indigo-50 flex justify-between items-center gap-4 group hover:border-indigo-200 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate mb-1 uppercase tracking-tight">{sc.question}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 italic">{sc.answer}</p>
                  </div>
                  <button 
                    onClick={() => onApproveSuggestion(sc.id)}
                    className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCards.length > 0 && currentCard ? (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xl h-[450px] perspective-1000">
              <div 
                className={`w-full h-full relative transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-white border border-slate-100 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden">
                   <div className="absolute top-10 left-10 flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${currentCard.masteryStatus === 'mastered' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                     <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">{currentCard.masteryStatus}</span>
                   </div>
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[1.5rem] flex items-center justify-center text-2xl mb-12">
                    <i className="fas fa-brain"></i>
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-[1.2] tracking-tight">{currentCard.question}</p>
                  <div className="mt-16 py-3 px-6 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <i className="fas fa-fingerprint"></i>
                    Verify Hypothesis
                  </div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-slate-950 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl text-white backface-hidden rotate-y-180">
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-2xl mb-12 text-indigo-400">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <p className="text-2xl font-medium leading-[1.6] text-slate-200 mb-12">{currentCard.answer}</p>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); markStatus(currentCard.id, 'learning'); }}
                      className="flex-1 py-4 bg-white/10 hover:bg-amber-500/20 text-amber-200 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Needs Practice
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); markStatus(currentCard.id, 'mastered'); }}
                      className="flex-1 py-4 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                    >
                      Mastered
                    </button>
                  </div>

                  <div className="mt-12 flex gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEdit(currentCard); }}
                      className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(currentCard.id); }}
                      className="w-12 h-12 bg-white/5 hover:bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12 mt-12">
              <button 
                onClick={() => { setIsFlipped(false); setCurrentIndex(p => Math.max(0, p - 1)); }}
                disabled={currentIndex === 0}
                className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-xl disabled:opacity-10 transition-all hover:scale-110 active:scale-95"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="flex flex-col items-center gap-2">
                <div className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black tracking-[0.3em] shadow-xl">
                  {currentIndex + 1} / {activeCards.length}
                </div>
                <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{filter} archive</p>
              </div>
              <button 
                onClick={goToNext}
                className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-xl transition-all hover:scale-110 active:scale-95"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
              <i className="fas fa-clone text-4xl"></i>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No Concepts In This View</p>
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg"
            >
              Seed Knowledge
            </button>
          </div>
        )}

        <button 
          onClick={() => setIsEditorOpen(true)}
          className="w-full py-10 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center gap-4 hover:bg-slate-50 hover:border-indigo-100 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <i className="fas fa-plus"></i>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] group-hover:text-indigo-600">Archive Additional Concept</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardsView;
