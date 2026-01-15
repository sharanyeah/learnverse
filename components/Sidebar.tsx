
import React from 'react';
import { Workspace } from '../types';

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onNewFile: () => void;
  onSelectSection: (index: number) => void;
  onClearAll: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  workspaces, activeWorkspaceId, onSelectWorkspace, onNewFile, onSelectSection, onClearAll
}) => {
  const activeWorkspace = workspaces.find(w => w.fileInfo.id === activeWorkspaceId);

  return (
    <aside className="w-80 bg-white border-r border-slate-100 h-screen flex flex-col z-30 shadow-[40px_0_80px_rgba(0,0,0,0.02)]">
      <div className="p-10 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-14">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <i className="fas fa-university text-lg"></i>
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter text-slate-900 block leading-none">DeepTutor</span>
              <span className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.4em] mt-1 block">Velocity V4</span>
            </div>
          </div>
          <button onClick={onNewFile} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100/50">
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Institutional Archive</label>
            <button onClick={onClearAll} className="text-[10px] text-slate-300 hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
            {workspaces.map(w => (
              <button key={w.fileInfo.id} onClick={() => onSelectWorkspace(w.fileInfo.id)} className={`w-full text-left px-5 py-4 rounded-xl transition-all flex items-center gap-4 border ${activeWorkspaceId === w.fileInfo.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'}`}>
                <i className={`fas ${w.fileInfo.type === 'ppt' ? 'fa-file-powerpoint text-amber-500' : 'fa-file-pdf text-rose-500'} text-xs`}></i>
                <span className="text-[11px] font-black truncate flex-1 uppercase tracking-tight">{w.fileInfo.name}</span>
              </button>
            ))}
          </div>
        </div>

        {activeWorkspace && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em] ml-1 mb-5">Course Units</label>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3 pb-10">
              {activeWorkspace.sections.map((section, idx) => (
                <button key={section.id} onClick={() => onSelectSection(idx)} className={`w-full text-left px-5 py-5 rounded-2xl border transition-all relative group ${activeWorkspace.activeSectionIndex === idx ? 'bg-indigo-50/50 border-indigo-100 text-indigo-950' : 'bg-white border-slate-50 text-slate-500 hover:bg-slate-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{section.sourceReference}</span>
                    {!!section.content ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> : <i className="fas fa-circle-notch fa-spin text-slate-200 text-[9px]"></i>}
                  </div>
                  <div className="text-[12px] font-bold leading-snug line-clamp-2">{section.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-slate-50 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-[10px] shadow-xl">JD</div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] mb-1">Status</p>
            <p className="text-[11px] font-bold text-slate-900">Lead Scholar</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
