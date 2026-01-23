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
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={closeDrawer} />
      <div className="fixed top-3 right-3 bottom-3 w-[560px] bg-[var(--surface)] border border-[var(--border)] rounded-[18px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-slide-in-right">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surfaceGlass)] backdrop-blur-md">
          <div>
            <div className="font-disp font-extrabold text-sm uppercase tracking-wide">{state.title || "Edit"}</div>
            <div className="font-mono text-[10px] text-[var(--inkDim)]">{state.sub || "Murty Governance"}</div>
          </div>
          <button onClick={closeDrawer} className="p-2 hover:bg-[var(--surface2)] rounded-lg text-[var(--inkDim)] hover:text-[var(--ink)] transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
            {state.content}
        </div>

        <div className="p-3.5 border-t border-[var(--border)] flex justify-end items-center gap-2.5 bg-[var(--surfaceGlass)] backdrop-blur-md">
          <button onClick={closeDrawer} className="h-9 px-4 rounded-xl border border-[var(--border)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent font-mono text-[11px] font-extrabold uppercase tracking-wide transition-all">
            Cancel
          </button>
          <button 
            onClick={() => { state.onSave?.(); }} 
            className="h-9 px-4 rounded-xl border-none text-[var(--bg)] bg-[var(--ink)] hover:-translate-y-px hover:shadow-lg font-mono text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-2 transition-all"
          >
            <Save size={16} /> {state.saveLabel || "Save"}
          </button>
        </div>
      </div>
    </>
  );
};
