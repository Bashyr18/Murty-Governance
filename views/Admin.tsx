import React from 'react';
import { useApp } from '../context/AppContext';
import { seedV10 } from '../constants';
import { toast } from '../components/Toasts';

export const Admin: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleReset = () => {
      if(window.confirm("Are you sure? This will wipe all local data.")) {
          dispatch({ type: 'RESET_STATE', payload: seedV10 });
          toast("System Reset", "Data restored to factory seed", "warn");
      }
  };

  const handleExport = () => {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murty_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast("Export Complete", "Check your downloads folder", "success");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="font-disp font-bold text-2xl">Admin & Data</h2>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col items-start gap-4">
                <h3 className="font-bold">Backup Data</h3>
                <p className="text-sm text-[var(--inkDim)]">Export full system state including all projects and people to JSON.</p>
                <button onClick={handleExport} className="px-4 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg font-bold text-xs uppercase hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-colors">
                    Export JSON
                </button>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--risk)] bg-[rgba(255,59,59,0.05)] flex flex-col items-start gap-4">
                <h3 className="font-bold text-[var(--risk)]">Danger Zone</h3>
                <p className="text-sm text-[var(--inkDim)]">Reset to empty seed state. Cannot be undone.</p>
                <button onClick={handleReset} className="px-4 py-2 bg-[var(--risk)] text-white rounded-lg font-bold text-xs uppercase hover:opacity-90 transition-colors">
                    Factory Reset
                </button>
            </div>
        </div>
    </div>
  );
};