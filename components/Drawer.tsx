
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

// Simple event bus for drawer
type DrawerEvent = {
  isOpen: boolean;
  title?: string;
  sub?: string;
  content?: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
};

let drawerListener: ((e: DrawerEvent) => void) | null = null;

export const openDrawer = (opts: Omit<DrawerEvent, 'isOpen'>) => {
  if (drawerListener) drawerListener({ isOpen: true, ...opts });
};

export const closeDrawer = () => {
  if (drawerListener) drawerListener({ isOpen: false });
};

export const Drawer: React.FC = () => {
  const [state, setState] = useState<DrawerEvent>({ isOpen: false });

  useEffect(() => {
    drawerListener = setState;
    return () => { drawerListener = null; };
  }, []);

  if (!state.isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm" onClick={closeDrawer} />
      <div className="fixed inset-x-0 bottom-0 sm:top-3 sm:right-3 sm:bottom-3 sm:left-auto sm:w-[560px] bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-slide-up sm:animate-slide-in-right h-[85vh] sm:h-auto max-h-full">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surfaceGlass)] backdrop-blur-md shrink-0">
          <div>
            <div className="font-disp font-extrabold text-base sm:text-lg uppercase tracking-wide">{state.title || "Edit"}</div>
            <div className="font-mono text-[10px] sm:text-[11px] text-[var(--inkDim)]">{state.sub || "Murty Governance"}</div>
          </div>
          <button onClick={closeDrawer} className="p-2 hover:bg-[var(--surface2)] rounded-full text-[var(--inkDim)] hover:text-[var(--ink)] transition-colors bg-[var(--surface2)]/50 sm:bg-transparent">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar overscroll-contain">
            {state.content}
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end items-center gap-3 bg-[var(--surfaceGlass)] backdrop-blur-md shrink-0 safe-area-bottom">
          <button onClick={closeDrawer} className="h-11 sm:h-10 px-5 rounded-xl border border-[var(--border)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent font-mono text-xs font-bold uppercase tracking-wide transition-all">
            Cancel
          </button>
          <button 
            onClick={() => { state.onSave?.(); }} 
            className="h-11 sm:h-10 px-6 rounded-xl border-none text-[var(--bg)] bg-[var(--ink)] hover:-translate-y-px hover:shadow-lg font-mono text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all flex-1 sm:flex-none justify-center"
          >
            <Save size={16} /> {state.saveLabel || "Save"}
          </button>
        </div>
      </div>
    </>
  );
};
