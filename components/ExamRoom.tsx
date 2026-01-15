
import React, { useState, useEffect } from 'react';
import { PracticeQuestion, CourseSection } from '../types';
import { generateMoreQuestions } from '../services/aiService';

interface PracticeQuestionsProps {
  questions: PracticeQuestion[];
  activeSection: CourseSection;
  onUpdateQuestions: (qs: PracticeQuestion[]) => void;
  onCorrect: () => void;
}

export const ExamRoom: React.FC<PracticeQuestionsProps> = ({ questions, activeSection, onUpdateQuestions, onCorrect }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs-review'>('all');

  const handleSelect = (qId: string, idx: number) => {
    const q = questions.find(item => item.id === qId);
    if (!q || q.hasBeenAnswered) return;

    const isCorrect = q.correctIndex === idx;
    const updated = questions.map(item => item.id === qId ? {
      ...item,
      hasBeenAnswered: true,
      wasCorrect: isCorrect
    } : item);

    onUpdateQuestions(updated);
    if (isCorrect) onCorrect();
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      const more = await generateMoreQuestions(activeSection, questions);
      onUpdateQuestions([...questions, ...more]);
    } catch (e) {
      alert("Cognitive synthesis failed. Try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const visibleQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    return q.hasBeenAnswered && !q.wasCorrect;
  });

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-pulse">
        <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl">
          <i className="fas fa-microchip text-2xl"></i>
        </div>
        <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-400">Synthesizing Cognitive Probes...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#fdfdfd] p-12">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="inline-block px-4 py-1.5 bg-slate-950 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
              Verification Protocol
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Exam Room</h3>
            <p className="text-slate-400 max-w-lg text-xs font-medium leading-relaxed">
              Rigorous diagnostic tools to verify conceptual depth. Incorrect responses are moved to your persistent review queue.
            </p>
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All Probes
            </button>
            <button 
              onClick={() => setFilter('needs-review')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'needs-review' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Review Queue ({questions.filter(q => q.hasBeenAnswered && !q.wasCorrect).length})
            </button>
          </div>
        </div>

        <div className="space-y-10">
          {visibleQuestions.map((q, qIdx) => (
            <div key={q.id} className={`bg-white p-12 rounded-[3.5rem] border transition-all relative overflow-hidden group ${
              q.hasBeenAnswered 
                ? q.wasCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-red-100 bg-red-50/20' 
                : 'border-slate-100 hover:border-indigo-100 hover:shadow-2xl'
            }`}>
              {q.hasBeenAnswered && !q.wasCorrect && (
                <div className="absolute top-0 right-0 px-6 py-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-bl-2xl">
                  Needs Review
                </div>
              )}

              <div className="flex gap-8 items-start mb-10">
                <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-all ${
                  q.hasBeenAnswered 
                    ? q.wasCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white' 
                    : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white'
                }`}>
                  {qIdx + 1}
                </span>
                <p className="text-2xl font-black text-slate-900 leading-[1.3] tracking-tight pt-1">{q.question}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {q.options?.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const hasAnswered = q.hasBeenAnswered;
                  
                  let style = "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent";
                  if (hasAnswered) {
                    if (isCorrect) style = "bg-emerald-600 text-white shadow-xl shadow-emerald-100 border-emerald-600";
                    else if (hasAnswered && !q.wasCorrect && q.correctIndex !== i) style = "bg-red-600 text-white shadow-xl shadow-red-100 border-red-600";
                    else style = "bg-white text-slate-200 border-slate-50 opacity-40";
                  }

                  return (
                    <button
                      key={i}
                      disabled={hasAnswered}
                      onClick={() => handleSelect(q.id, i)}
                      className={`w-full text-left p-7 rounded-[2rem] font-bold text-sm transition-all flex items-center gap-6 ${style}`}
                    >
                      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[11px] flex-shrink-0 font-black ${
                        hasAnswered ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-white'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {q.hasBeenAnswered && (
                <div className={`mt-10 p-10 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 border shadow-sm ${
                  q.wasCorrect 
                    ? 'bg-white border-emerald-100 text-emerald-950' 
                    : 'bg-white border-red-100 text-red-950'
                }`}>
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      q.wasCorrect ? 'bg-emerald-500' : 'bg-red-500'
                    } text-white`}>
                      <i className={`fas ${q.wasCorrect ? 'fa-check-double' : 'fa-lightbulb'}`}></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        {q.wasCorrect ? 'Conceptual Alignment' : 'Diagnostic Insight'}
                      </p>
                      <p className="text-sm font-black">
                        {q.wasCorrect ? 'Precision Achieved' : 'Analyzing Logical Divergence'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[15px] font-medium leading-[1.7] opacity-80 pl-1">
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-100 flex flex-col items-center gap-6">
          <button 
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className={`px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-6 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                Synthesizing New Probes...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                Generate 5 Additional Probes
              </>
            )}
          </button>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Powered by DeepTutor AI Engine</p>
        </div>
      </div>
    </div>
  );
};
