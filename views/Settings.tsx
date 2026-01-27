
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from '../components/Toasts';
import { Activity, Database, History as HistoryIcon, Layers, Calculator, Info, Search, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Avatar } from '../components/Shared';

const AuditLedger = () => {
    const { state } = useApp();
    const [filter, setFilter] = useState('');

    const filteredLogs = useMemo(() => {
        const t = filter.toLowerCase().trim();
        if (!t) return state.audit;
        return state.audit.filter(l => 
            l.userId.toLowerCase().includes(t) || 
            l.action.toLowerCase().includes(t) || 
            l.entity.type.toLowerCase().includes(t) ||
            l.entity.id.toLowerCase().includes(t)
        );
    }, [state.audit, filter]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg">System Activity Ledger</h3>
                    <p className="text-xs text-[var(--inkDim)]">Audit trail of all portfolio and taxonomy mutations.</p>
                </div>
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-3 text-[var(--inkDim)] group-focus-within:text-[var(--accent)]" />
                    <input 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search logs..."
                        className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs w-full md:w-64 outline-none focus:border-[var(--accent)] transition-all"
                    />
                </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] sm:text-xs">
                        <thead className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--inkDim)] font-mono uppercase tracking-widest text-[9px]">
                            <tr>
                                <th className="p-4 w-[180px]">Timestamp</th>
                                <th className="p-4 w-[120px]">Actor</th>
                                <th className="p-4 w-[100px]">Entity</th>
                                <th className="p-4 w-[100px]">Action</th>
                                <th className="p-4">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border2)] font-mono">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-[var(--surface2)] transition-colors">
                                    <td className="p-4 text-[var(--inkDim)] whitespace-nowrap">
                                        {new Date(log.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar personId={log.userId} className="w-5 h-5 text-[8px]"/>
                                            <span className="font-bold text-[var(--ink)]">{log.userId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--inkDim)]">{log.entity.type}</span>
                                    </td>
                                    <td className="p-4 font-black">
                                        <span className={
                                            log.action === 'DELETE' ? 'text-[var(--risk)]' : 
                                            log.action === 'CREATE' ? 'text-[var(--safe)]' : 'text-[var(--accent)]'
                                        }>{log.action}</span>
                                    </td>
                                    <td className="p-4 text-[var(--inkDim)] truncate max-w-[200px]">
                                        {log.entity.id}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr><td colSpan={5} className="p-12 text-center text-[var(--inkDim)] italic">No audit records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'workload' | 'logic' | 'taxonomy' | 'audit' | 'data'>('workload');
  
  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === id ? 'border-[var(--accent)] text-[var(--ink)] bg-[var(--surface2)]' : 'border-transparent text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
      >
          <Icon size={14} /> {label}
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
        <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="font-disp font-black text-2xl text-[var(--ink)] uppercase">System Configuration</h2>
                <p className="text-xs text-[var(--inkDim)] mt-1 font-mono">v1.12 • Enterprise Governance Rules</p>
            </div>
        </div>
        
        <div className="flex px-4 overflow-x-auto scrollbar-hide border-b border-[var(--border)] bg-[var(--surface)]/30">
            <TabButton id="workload" label="Capacity Math" icon={Calculator} />
            <TabButton id="logic" label="Health Logic" icon={Activity} />
            <TabButton id="taxonomy" label="Taxonomy" icon={Layers} />
            <TabButton id="audit" label="Activity Ledger" icon={HistoryIcon} />
            <TabButton id="data" label="Maintenance" icon={Database} />
        </div>

        <div className="p-6">
            {activeTab === 'audit' && <AuditLedger />}
            {activeTab === 'data' && (
                <div className="max-w-2xl space-y-6">
                    <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[var(--risk)]/10 text-[var(--risk)] rounded-2xl"><AlertTriangle size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg">Destructive Operations</h3>
                                <p className="text-sm text-[var(--inkDim)]">System-wide data purge and reset tools.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => { if(window.confirm("IRREVERSIBLE: Purge all local data and reset to seed?")) { localStorage.clear(); window.location.reload(); } }} 
                                className="p-5 rounded-2xl border-2 border-dashed border-[var(--risk)]/20 hover:bg-[var(--risk)]/5 transition-colors text-left group"
                            >
                                <div className="font-bold text-[var(--risk)] uppercase text-xs">Factory Reset</div>
                                <div className="text-[10px] text-[var(--inkDim)] mt-1">Clears browser storage and restores original firm seed data.</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab !== 'audit' && activeTab !== 'data' && (
                <div className="p-20 text-center text-[var(--inkDim)] opacity-50 flex flex-col items-center">
                    <Info size={48} className="mb-4"/> 
                    <p className="text-sm font-bold uppercase tracking-widest">Configuration Panel</p>
                    <p className="text-xs mt-1">Mathematical and structural settings for the cockpit.</p>
                </div>
            )}
        </div>
    </div>
  );
};
