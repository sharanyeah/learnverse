
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Concept } from '../types';
import { chatWithTutor } from '../services/aiService';

interface ChatInterfaceProps {
  activeConcept: Concept;
  onUpdateMastery: (id: string, increase: number) => void;
  attachment?: any;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  activeConcept, 
  onUpdateMastery, 
  messages, 
  onAddMessage 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    onAddMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithTutor(messages, activeConcept, inputValue);
      
      const modelMessage: Message = {
        role: 'model',
        text: response.text || "I was just processing that concept. Could you clarify your last point?",
        timestamp: new Date().toISOString(),
        sources: response.sources
      };

      onAddMessage(modelMessage);
      onUpdateMastery(activeConcept.id, 5);
    } catch (error) {
      console.error("Chat error:", error);
      onAddMessage({
        role: 'model',
        text: "I'm having a bit of trouble connecting to the knowledge base. Let's try re-focusing on the main concept.",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-white shadow-xl rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-3xl mb-8">
              <i className="fas fa-microchip"></i>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-4">Neural Tutor V4 Active</p>
            <p className="text-sm font-medium text-slate-500 leading-relaxed px-6">
              I am grounded in <b>{activeConcept.title}</b>. Ask for derivations, logic checks, or conceptual bridges.
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-400`}>
            <div className={`max-w-2xl flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md transition-transform ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-indigo-600 border border-indigo-50'
              }`}>
                <i className={`fas ${msg.role === 'user' ? 'fa-fingerprint' : 'fa-brain'} text-[11px]`}></i>
              </div>
              <div className="space-y-2">
                <div className={`p-7 rounded-[2.2rem] text-sm font-medium shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-900 rounded-tr-none' 
                    : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                }`}>
                  {msg.role === 'model' && (
                    <div className="mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">DeepTutor Engine</span>
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none prose-slate font-sans text-[15px] leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-8 pt-5 border-t border-slate-50 flex flex-wrap gap-2">
                      {msg.sources.map((src, sIdx) => (
                        <a 
                          key={sIdx} 
                          href={src.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 font-bold"
                        >
                          <i className="fas fa-link"></i>
                          {src.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 animate-pulse"></div>
            <div className="bg-white border border-indigo-50 px-6 py-4 rounded-full flex gap-1.5 items-center shadow-sm">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
              <span className="ml-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Neural Reasoning...</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-12 pb-12 pt-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end bg-slate-50 p-3 rounded-[2rem] border border-slate-200 focus-within:bg-white focus-within:shadow-xl focus-within:border-indigo-200 transition-all duration-300">
          <textarea
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Test a hypothesis or ask for a derivation..."
            className="flex-1 p-4 bg-transparent border-none focus:ring-0 outline-none resize-none max-h-40 min-h-[50px] text-[15px] font-medium text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              inputValue.trim() && !isLoading
                ? 'bg-indigo-600 text-white shadow-lg hover:scale-105 active:scale-95'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <i className="fas fa-paper-plane text-[15px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
