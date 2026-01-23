import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'warn' | 'info';

interface ToastItem {
  id: string;
  title: string;
  sub?: string;
  kind: ToastKind;
}

let toastListener: ((t: ToastItem) => void) | null = null;

export const toast = (title: string, sub: string = "", kind: ToastKind = "info") => {
  if (toastListener) toastListener({ id: Math.random().toString(36), title, sub, kind });
};

export const Toasts: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListener = (t) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== t.id));
      }, 3000);
    };
    return () => { toastListener = null; };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 pointer-events-none">
      {items.map(t => {
        const colors = 
            t.kind === 'success' ? 'border-[var(--safe)]' : 
            t.kind === 'error' ? 'border-[var(--risk)]' : 
            t.kind === 'warn' ? 'border-[var(--warn)]' : 'border-[var(--accent)]';
        
        const Icon = 
            t.kind === 'success' ? CheckCircle : 
            t.kind === 'error' ? AlertTriangle : 
            t.kind === 'warn' ? AlertCircle : Info;

        return (
          <div key={t.id} className={`pointer-events-auto min-w-[320px] p-3 rounded-[14px] border border-[var(--border)] border-l-[3px] ${colors} bg-[var(--surfaceGlass)] backdrop-blur-md shadow-lg flex items-start gap-3 animate-slide-up`}>
            <Icon size={18} className="mt-0.5 opacity-90" />
            <div>
              <div className="font-extrabold text-[13px]">{t.title}</div>
              {t.sub && <div className="text-[12px] text-[var(--inkDim)] mt-0.5">{t.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
