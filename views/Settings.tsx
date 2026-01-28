
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from '../components/Toasts';
import { seedV10 } from '../constants';
import { Compute } from '../services/compute';
import { Save, Download, Trash2, Plus, AlertTriangle, Layers, Sliders, Database, Activity, RotateCcw, LayoutTemplate, Upload, HelpCircle, Table, Info, ChevronRight, Zap, CheckCircle, Clock, History, BookOpen, FileText, ToggleLeft, ToggleRight, Calculator, Edit3, FileJson, AlertOctagon, Lock, Unlock, X, RefreshCw, Shield, ChevronDown, ChevronUp, Server, HardDrive, Cpu, Terminal, AlertCircle, ShieldAlert } from 'lucide-react';
import { WorkloadSettings } from '../types';

// --- SHARED COMPONENTS ---

const ConfigInput = ({ 
    value, 
    onChange, 
    type, 
    min, 
    max, 
    hasError 
}: { 
    value: any, 
    onChange: (val: any) => void, 
    type: 'text'|'number'|'boolean',
    min?: number,
    max?: number,
    hasError?: boolean
}) => {
    const [local, setLocal] = useState(value?.toString() ?? '');
    const [isFocused, setIsFocused] = useState(false);
    
    useEffect(() => {
        if (!isFocused) {
            setLocal(value?.toString() ?? '');
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setLocal(v);
        if (type === 'text') {
            onChange(v);
        } else if (type === 'number') {
            const p = parseFloat(v);
            if (!isNaN(p) && v.trim() !== '' && !v.endsWith('.')) {
                // Enforce Min/Max on Input
                if (min !== undefined && p < min) return; 
                // We allow typing larger numbers temporarily, but visual validation handles the rest
                onChange(p);
            }
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (type === 'number') {
            let p = parseFloat(local);
            if (isNaN(p)) {
                setLocal(value?.toString() ?? '');
            } else {
                // Clamp on blur
                if (min !== undefined) p = Math.max(min, p);
                if (max !== undefined) p = Math.min(max, p);
                onChange(p);
                setLocal(p.toString());
            }
        } else {
            onChange(local);
        }
    };

    return (
        <input 
            type="text" 
            value={local}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            className={`
                w-full bg-transparent border-b outline-none rounded-none px-2 py-1.5 text-xs transition-all
                ${hasError ? 'border-[var(--risk)] text-[var(--risk)] font-bold' : 'border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] text-[var(--ink)] font-bold'}
                ${type === 'number' ? 'font-mono text-right' : ''}
            `}
        />
    );
};

const LogicPanel = ({ title, description, formula, icon: Icon, impact }: { title: string, description: string, formula?: string, icon: any, impact?: string }) => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
                <h4 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wide flex items-center gap-2 mb-2">
                    <Icon size={16} className="text-[var(--accent)]"/> {title}
                </h4>
                <p className="text-xs text-[var(--inkDim)] leading-relaxed max-w-3xl mb-3">{description}</p>
                {formula && (
                    <div className="inline-flex items-center gap-3 bg-[var(--surface2)] px-3 py-2 rounded-lg border border-[var(--border)] mt-2">
                        <span className="text-[10px] font-bold text-[var(--inkDim)] uppercase tracking-wider flex items-center gap-1"><Calculator size={10}/> Algorithm:</span>
                        <code className="font-mono text-[10px] text-[var(--accent)]">{formula}</code>
                    </div>
                )}
            </div>
            {impact && (
                <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)] min-w-[200px] shrink-0">
                    <div className="text-[10px] font-bold text-[var(--inkDim)] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Activity size={12} className="text-[var(--warn)]"/> Scope of Impact
                    </div>
                    <div className="text-xs font-medium text-[var(--ink)] leading-tight">
                        {impact}
                    </div>
                </div>
            )}
        </div>
    </div>
);

const TaxonomyEditor = ({ 
    title, 
    items, 
    onUpdate, 
    prefix, 
    idField = 'id',
    usageCheck,
    description
}: { 
    title: string, 
    items: any[], 
    onUpdate: (newItems: any[]) => void, 
    prefix: string, 
    idField?: string,
    usageCheck?: (id: string) => boolean,
    description?: string
}) => {
    
    // Duplicate Detection
    const duplicates = useMemo(() => {
        const counts: Record<string, number> = {};
        items.forEach(i => {
            const val = i[idField] || i.id;
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.keys(counts).filter(k => counts[k] > 1);
    }, [items, idField]);

    const handleAdd = () => {
        const newId = `${prefix}-${Math.floor(Math.random() * 10000)}`;
        const newItem = idField === 'key' ? { key: newId, name: '' } : { id: newId, name: '' };
        onUpdate([...items, newItem]);
    };

    const handleDelete = (idToRemove: string) => {
        if (usageCheck && usageCheck(idToRemove)) {
            toast("Cannot Delete", "This item is currently in use by active records.", "error");
            return;
        }
        if (window.confirm(`Are you sure you want to remove ${idToRemove}?`)) {
            onUpdate(items.filter(x => (x[idField] || x.id) !== idToRemove));
        }
    };

    const handleEdit = (idx: number, field: string, value: string) => {
        const newList = [...items];
        newList[idx] = { ...newList[idx], [field]: value };
        onUpdate(newList);
    };

    return (
        <div className="flex flex-col h-[420px] rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden group hover:border-[var(--accent)] transition-all duration-300">
            <div className="flex flex-col p-5 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm text-[var(--ink)] uppercase tracking-wide flex items-center gap-2">
                        <Layers size={14} className="text-[var(--accent)]"/> {title}
                    </h3>
                    <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[10px] font-bold uppercase shadow-sm active:scale-95">
                        <Plus size={12} /> Add
                    </button>
                </div>
                {description && <p className="text-[10px] text-[var(--inkDim)] leading-tight">{description}</p>}
                {duplicates.length > 0 && (
                    <div className="mt-2 text-[10px] text-[var(--risk)] font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={10} /> Duplicate IDs found: {duplicates.join(', ')}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-[var(--card)]">
                {items.map((item, idx) => {
                    const itemId = item[idField] || item.id;
                    const isDup = duplicates.includes(itemId);
                    const isUsed = usageCheck ? usageCheck(itemId) : false;

                    return (
                        <div key={item[idField] || item.id || idx} className={`flex items-center gap-3 p-2 rounded-xl transition-colors group/item animate-fade-in ${isDup ? 'bg-[var(--risk)]/10 border border-[var(--risk)]/20' : 'hover:bg-[var(--surface2)]'}`}>
                            <div className="w-24 shrink-0">
                                <input 
                                    value={itemId}
                                    onChange={(e) => handleEdit(idx, idField, e.target.value)}
                                    disabled={isUsed}
                                    title={isUsed ? "Cannot edit ID: Item is currently referenced by projects or people." : "Unique Identifier"}
                                    className={`w-full bg-[var(--surface)] text-center border rounded-lg py-1.5 text-[10px] font-mono font-bold outline-none text-[var(--ink)] transition-colors 
                                        ${isDup ? 'border-[var(--risk)] text-[var(--risk)]' : 'border-[var(--border)] focus:border-[var(--accent)]'}
                                        ${isUsed ? 'opacity-60 cursor-not-allowed bg-[var(--surface2)]' : ''}
                                    `}
                                    placeholder="ID"
                                />
                            </div>
                            <div className="flex-1">
                                <input 
                                    value={item.name}
                                    onChange={(e) => handleEdit(idx, 'name', e.target.value)}
                                    className="w-full bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--ink)] py-1 transition-colors"
                                    placeholder="Enter Name..."
                                />
                            </div>
                            <button 
                                onClick={() => handleDelete(itemId)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[var(--inkDim)] transition-all focus:opacity-100
                                    ${isUsed ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--risk)] hover:text-white opacity-0 group-hover/item:opacity-100'}
                                `}
                                title={isUsed ? "Cannot delete used item" : "Delete Item"}
                                disabled={isUsed}
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface ColDef {
    key: string;
    label: string;
    type: 'text'|'number'|'boolean';
    help?: string;
    width?: string;
    min?: number;
    max?: number;
    isKey?: boolean; // If true, checks for duplicates
}

interface ConfigTableProps {
    data: any[];
    columns: ColDef[];
    onUpdate: (d: any[]) => void;
    onAdd?: () => void;
    onDelete?: (idx: number) => void;
    title: string;
    description?: string;
    logicDescription?: string;
    formula?: string;
    icon?: any;
    showDefinitions: boolean;
}

const ConfigTable: React.FC<ConfigTableProps> = ({ 
    data, 
    columns, 
    onUpdate, 
    onAdd,
    onDelete,
    title, 
    description, 
    logicDescription,
    formula,
    icon: Icon = Table,
    showDefinitions
}) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper: Find duplicates for Key columns
    const getDuplicates = (colKey: string) => {
        const counts: Record<string, number> = {};
        data.forEach(row => {
            const val = String(row[colKey]);
            counts[val] = (counts[val] || 0) + 1;
        });
        return new Set(Object.keys(counts).filter(k => counts[k] > 1));
    };

    // Helper: Generate a stable React key from row data
    const getRowKey = (row: any, idx: number) => {
        // Try common ID fields first
        if (row.id) return row.id;
        if (row.key) return row.key;
        if (row.grade) return row.grade;
        if (row.role) return row.role;
        if (row.level) return `lvl-${row.level}`;
        if (row.lifecycleId) return row.lifecycleId;
        // Fallback to composed string if no single ID found
        const values = Object.values(row).join('-');
        return `${values}-${idx}`;
    };

    return (
        <div className="border border-[var(--border)] rounded-3xl overflow-hidden bg-[var(--card)] mb-8 shadow-sm transition-all hover:shadow-md group">
            
            {/* Header Section */}
            <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div>
                        <h3 className="font-bold text-base text-[var(--ink)] uppercase flex items-center gap-2 tracking-wide group-hover:text-[var(--accent)] transition-colors">
                            <Icon size={16} className="text-[var(--accent)]" /> {title}
                        </h3>
                        {description && <p className="text-xs text-[var(--inkDim)] leading-relaxed mt-1">{description}</p>}
                    </div>
                    <div className="p-1 rounded-full hover:bg-[var(--surface2)] text-[var(--inkDim)] transition-colors">
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                </div>

                {isExpanded && logicDescription && (
                    <div className="mt-4 p-4 bg-[var(--surface2)]/50 rounded-xl border border-[var(--border2)] flex flex-col md:flex-row gap-4 items-start animate-fade-in">
                        <div className="flex-1">
                            <h4 className="text-[10px] font-bold uppercase text-[var(--inkDim)] mb-1 flex items-center gap-1"><Cpu size={12}/> System Impact</h4>
                            <p className="text-xs text-[var(--ink)] leading-relaxed">{logicDescription}</p>
                        </div>
                        {formula && (
                            <div className="bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--border)] shrink-0 self-stretch md:self-center flex items-center justify-center min-w-[200px]">
                                <code className="text-[10px] font-mono text-[var(--accent)] font-bold">{formula}</code>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {isExpanded && (
                <>
                    {isMobile ? (
                        <div className="p-4 space-y-4">
                            {data.map((row, rIdx) => (
                                <div key={getRowKey(row, rIdx)} className="bg-[var(--surface2)] rounded-xl p-4 space-y-3 border border-[var(--border)] relative">
                                    {onDelete && (
                                        <button onClick={() => onDelete(rIdx)} className="absolute top-2 right-2 p-2 text-[var(--inkDim)] hover:text-[var(--risk)]">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {/* Mobile fields renderer */}
                                    {columns.map(c => (
                                        <div key={c.key} className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1 max-w-[60%]">
                                                <span className="text-xs text-[var(--inkDim)]">{c.label}</span>
                                            </div>
                                            <div className="w-[35%] text-right">
                                                {c.type === 'boolean' ? (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={row[c.key]} 
                                                        onChange={e => {
                                                            const newData = [...data];
                                                            newData[rIdx] = { ...row, [c.key]: e.target.checked };
                                                            onUpdate(newData);
                                                        }}
                                                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-0 cursor-pointer bg-[var(--surface)]"
                                                    />
                                                ) : (
                                                    <ConfigInput 
                                                        type={c.type}
                                                        value={row[c.key]}
                                                        min={c.min}
                                                        max={c.max}
                                                        onChange={(val) => {
                                                            const newData = [...data];
                                                            newData[rIdx] = { ...row, [c.key]: val };
                                                            onUpdate(newData);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
                                    <tr>
                                        {columns.map(c => (
                                            <th key={c.key} className={`p-4 align-top transition-all duration-300 ${c.width || 'w-auto'}`}>
                                                <div className="flex flex-col gap-2 group/head">
                                                    <div className="flex items-center gap-1 font-bold text-[var(--ink)] text-[10px] uppercase tracking-wider">
                                                        {c.label}
                                                        {c.help && <Info size={10} className="text-[var(--inkDim)] opacity-50 group-hover/head:opacity-100 group-hover/head:text-[var(--accent)] transition-all" />}
                                                    </div>
                                                    {c.help && showDefinitions && (
                                                        <div className="text-[9px] text-[var(--inkDim)] font-medium leading-relaxed opacity-80 border-l-2 border-[var(--border)] pl-2">
                                                            {c.help}
                                                        </div>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {onDelete && <th className="p-4 w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border2)]">
                                    {data.map((row, rIdx) => {
                                        return (
                                            <tr key={getRowKey(row, rIdx)} className="hover:bg-[var(--surface2)] transition-colors group/row">
                                                {columns.map((c, cIdx) => {
                                                    const duplicates = c.isKey ? getDuplicates(c.key) : new Set();
                                                    const hasError = c.isKey && duplicates.has(String(row[c.key]));
                                                    
                                                    return (
                                                        <td key={c.key} className="p-3 relative align-top">
                                                            {c.type === 'boolean' ? (
                                                                <div className="flex items-center h-[26px]">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={row[c.key]} 
                                                                        onChange={e => {
                                                                            const newData = [...data];
                                                                            newData[rIdx] = { ...row, [c.key]: e.target.checked };
                                                                            onUpdate(newData);
                                                                        }}
                                                                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-0 cursor-pointer bg-[var(--surface)]"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <ConfigInput 
                                                                        type={c.type}
                                                                        value={row[c.key]}
                                                                        min={c.min}
                                                                        max={c.max}
                                                                        hasError={hasError}
                                                                        onChange={(val) => {
                                                                            const newData = [...data];
                                                                            newData[rIdx] = { ...row, [c.key]: val };
                                                                            onUpdate(newData);
                                                                        }}
                                                                    />
                                                                    {hasError && (
                                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--risk)] pointer-events-none pr-1">
                                                                            <AlertCircle size={12} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                {onDelete && (
                                                    <td className="p-3 align-middle text-right">
                                                        <button 
                                                            onClick={() => onDelete(rIdx)}
                                                            className="p-1.5 rounded-lg text-[var(--inkDim)] hover:bg-[var(--risk)] hover:text-white transition-all opacity-0 group-hover/row:opacity-100 focus:opacity-100"
                                                            title="Delete Row"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {onAdd && (
                        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface2)]">
                            <button 
                                onClick={onAdd}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] border border-[var(--border)] text-xs font-bold uppercase transition-all shadow-sm w-full sm:w-auto justify-center"
                            >
                                <Plus size={14} /> Add Row
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const Settings: React.FC = () => {
  const { state, dispatch, lastSaveTime } = useApp();
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'logic' | 'workload' | 'data'>('workload');
  const [localSettings, setLocalSettings] = useState(state.settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [auditNote, setAuditNote] = useState('');
  const [showDefinitions, setShowDefinitions] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // Data Tab States
  const [diagnosticsLog, setDiagnosticsLog] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ACCESS CHECK
  const tier = Compute.getAccessLevel(state.ui.currentUser);
  if (tier > 2) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-fade-in">
              <ShieldAlert size={64} className="text-[var(--risk)] mb-6 opacity-20" />
              <h2 className="text-2xl font-bold text-[var(--ink)] mb-2">Configuration Restricted</h2>
              <p className="text-[var(--inkDim)] max-w-md">
                  System configuration is locked for operational tiers. <br/>
                  Please contact the Central Management Office or a Partner for adjustments to the governance model.
              </p>
          </div>
      );
  }

  useEffect(() => {
     if(!hasChanges) setLocalSettings(state.settings);
  }, [state.settings, hasChanges]);

  // --- IMPACT ANALYSIS ---
  const getImpactSummary = (tab: string) => {
      if (tab === 'workload') {
          return `Calculations for ${state.people.length} people will be affected.`;
      }
      if (tab === 'taxonomy') {
          return `Changing keys may break links for ${state.workItems.length} projects.`;
      }
      if (tab === 'logic') {
          return `Health scores for ${state.workItems.length} projects will be recalculated.`;
      }
      return '';
  };

  // --- Core Save/Cancel Logic ---
  const saveSettings = () => {
      let finalNote = auditNote;
      if (activeTab === 'workload' && !finalNote.trim()) {
          finalNote = "Configuration update";
      }

      if (activeTab === 'workload') {
          const diff: any = {};
          const keys = Object.keys(localSettings.workload) as (keyof typeof localSettings.workload)[];
          keys.forEach(k => {
              if (JSON.stringify(localSettings.workload[k]) !== JSON.stringify(state.settings.workload[k])) {
                  diff[k] = { old: state.settings.workload[k], new: localSettings.workload[k] };
              }
          });
          dispatch({ type: 'UPDATE_WORKLOAD_SETTINGS', payload: { fullSettings: localSettings, diff, note: finalNote } });
      } else {
          dispatch({ type: 'UPDATE_SETTINGS', payload: localSettings });
      }
      
      setHasChanges(false);
      setAuditNote('');
      toast("Configuration Saved", "System rules updated successfully", "success");
  };

  const cancelChanges = () => {
      setLocalSettings(state.settings);
      setHasChanges(false);
      setAuditNote('');
      setRefreshKey(k => k + 1);
      toast("Changes Discarded", "Reverted to last saved configuration", "info");
  };

  // --- HELPER: GENERIC ADD/DELETE HANDLERS ---
  const handleAddRow = (section: keyof WorkloadSettings, defaultObj: any) => {
      setLocalSettings(prev => ({
          ...prev,
          workload: {
              ...prev.workload,
              [section]: [...prev.workload[section], defaultObj]
          }
      }));
      setHasChanges(true);
  };

  const handleDeleteRow = (section: keyof WorkloadSettings, index: number) => {
      if(!window.confirm("Are you sure you want to delete this row? This may affect scores immediately.")) return;
      setLocalSettings(prev => {
          const newList = [...prev.workload[section]];
          newList.splice(index, 1);
          return {
              ...prev,
              workload: {
                  ...prev.workload,
                  [section]: newList
              }
          };
      });
      setHasChanges(true);
  };

  // --- Data Management Handlers ---
  const handleBackup = () => {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murty_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
      a.click();
      toast("Backup Downloaded", "Store this file securely", "success");
  };

  const handleRestoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              
              // Enhanced Validation logic
              if (json.meta && json.meta.schemaVersion !== state.meta.schemaVersion) {
                  const msg = `Version Mismatch: Backup is v${json.meta?.schemaVersion || 'Unknown'}, System is v${state.meta.schemaVersion}. Import anyway?`;
                  if (!window.confirm(msg)) return;
              }

              if (window.confirm("Restore this data? This will overwrite ALL current state (People, Projects, Config).")) {
                  dispatch({ type: 'RESET_STATE', payload: json });
                  toast("System Restored", "Data loaded from backup file", "success");
              }
          } catch (err) {
              toast("Import Failed", "Invalid JSON file structure", "error");
          }
          // Clear value to allow re-selection
          event.target.value = '';
      };
      reader.readAsText(file);
  };

  const handleFactoryReset = () => {
      if(window.confirm("DANGER: This will wipe all data and return to seed state. Continue?")) {
          // Deep clone seed to ensure no mutation reference issues
          const freshSeed = JSON.parse(JSON.stringify(seedV10));
          dispatch({ type: 'RESET_STATE', payload: freshSeed });
          // Force local state update immediately to reflect reset in UI
          setLocalSettings(freshSeed.settings);
          setHasChanges(false);
          toast("Factory Reset", "System returned to initial state. Reloading...", "warn");
          // Hard reload to clear any lingering React state issues
          setTimeout(() => window.location.reload(), 1000);
      }
  };

  const runDiagnostics = () => {
      const logs = Compute.runDiagnostics(state);
      setDiagnosticsLog(logs.length > 0 ? logs : ["No issues found. System integrity nominal."]);
      toast("Diagnostics Complete", `${logs.length} issues found`, logs.length > 0 ? "warn" : "success");
  };

  // --- Helpers for other tabs ---
  const updateTaxonomyList = useCallback((section: keyof typeof localSettings.taxonomy, newList: any[]) => {
      setLocalSettings(prev => ({ ...prev, taxonomy: { ...prev.taxonomy, [section]: newList } }));
      setHasChanges(true);
  }, []);

  const updateRaciTemplate = (newList: string[]) => {
      setLocalSettings(prev => ({ ...prev, templates: { ...prev.templates, raciDecisionAreas: newList } }));
      setHasChanges(true);
  };

  const checkUnitUsage = (id: string) => state.people.some(p => p.unitId === id) || state.workItems.some(w => w.teamUnitId === id);
  const checkLifecycleUsage = (id: string) => state.workItems.some(w => w.lifecycleId === id);
  const checkWorkTypeUsage = (id: string) => state.workItems.some(w => w.typeId === id);
  const checkRoleUsage = (key: string) => state.workItems.some(w => w.staffing.some(s => s.roleKey === key));

  const updateNestedWeight = (category: 'workload'|'health'|'governance', subKey: string, finalKey: string, val: number) => {
      const safeVal = isNaN(val) ? 0 : val;
      setLocalSettings(prev => {
          const catObj = { ...prev.weights[category] } as any;
          if (subKey === 'impactWeight') {
              catObj.impactWeight = { ...catObj.impactWeight, [finalKey]: safeVal };
          } else {
              catObj[finalKey] = safeVal;
          }
          return { ...prev, weights: { ...prev.weights, [category]: catObj } };
      });
      setHasChanges(true);
  };

  const updateReportConfig = (lifecycle: string, val: number) => {
      const safeVal = isNaN(val) ? 14 : val;
      setLocalSettings(prev => ({
          ...prev,
          weights: {
              ...prev.weights,
              reporting: {
                  ...prev.weights.reporting,
                  expectedUpdateDaysByLifecycle: {
                      ...prev.weights.reporting.expectedUpdateDaysByLifecycle,
                      [lifecycle]: safeVal
                  }
              }
          }
      }));
      setHasChanges(true);
  };

  const updateWorkloadConfig = (section: string, newData: any[]) => {
      setLocalSettings(prev => ({ ...prev, workload: { ...prev.workload, [section]: newData } }));
      setHasChanges(true);
  };

  const TabButton: React.FC<{ id: string; label: string; icon: any }> = ({ id, label, icon: Icon }) => (
      <button 
        onClick={() => { setActiveTab(id as any); window.scrollTo({top: 0, behavior: 'smooth'}); }}
        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium whitespace-nowrap ${activeTab === id ? 'border-[var(--accent)] text-[var(--ink)] font-bold bg-[var(--surface2)]' : 'border-transparent text-[var(--inkDim)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'}`}
      >
          <Icon size={16} /> {label}
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm transition-all">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-disp font-bold text-2xl leading-tight text-[var(--ink)]">System Configuration</h2>
                    <p className="text-xs text-[var(--inkDim)] mt-1">Global logic, math engines, and structural definitions.</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button 
                        onClick={() => setShowDefinitions(!showDefinitions)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${showDefinitions ? 'bg-[var(--surface2)] text-[var(--accent)] border-[var(--accent)]' : 'bg-transparent text-[var(--inkDim)] border-[var(--border)] hover:border-[var(--inkDim)]'}`}
                    >
                        {showDefinitions ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>} 
                        Explainers
                    </button>

                    {hasChanges && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto animate-fade-in">
                            {activeTab === 'workload' && (
                                <input 
                                    value={auditNote}
                                    onChange={(e) => setAuditNote(e.target.value)}
                                    placeholder="Audit note..."
                                    className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs w-full sm:w-48 focus:w-64 focus:border-[var(--accent)] outline-none transition-all placeholder:text-[var(--inkDim)]/50 font-bold"
                                />
                            )}
                            <div className="flex gap-2">
                                <button onClick={cancelChanges} className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--inkDim)] hover:text-[var(--ink)] font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all bg-[var(--surface)] hover:bg-[var(--surface2)]">
                                    <RotateCcw size={14} /> Revert
                                </button>
                                <button onClick={saveSettings} className="flex-1 px-6 py-2 bg-[var(--accent)] text-[var(--bg)] rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 animate-scale-in shadow-lg hover:opacity-90 transition-all">
                                    <Save size={14} /> Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex px-4 overflow-x-auto scrollbar-hide">
                <TabButton id="workload" label="Workload Engine" icon={Activity} />
                <TabButton id="logic" label="Health Logic" icon={Sliders} />
                <TabButton id="taxonomy" label="Taxonomy" icon={Layers} />
                <TabButton id="data" label="Data & Maintenance" icon={Database} />
            </div>
        </div>

        <div className="animate-slide-up min-h-[500px] p-4 sm:p-6">
            
            {/* WORKLOAD TAB */}
            {activeTab === 'workload' && (
                <div className="space-y-8 animate-fade-in">
                    <LogicPanel 
                        icon={Calculator}
                        title="The Workload Equation"
                        description="This engine calculates a unified 'Workload Score' for every person. It combines their grade capacity (denominator) with the sum of their project assignments (numerator). Assignments are weighted by Role, Project Complexity, and Lifecycle Phase to reflect true cognitive load rather than just hours."
                        formula="Score = Σ (Stage × Role × Complexity × Allocation) + Penalties"
                        impact={getImpactSummary('workload')}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="col-span-1 lg:col-span-2">
                            <ConfigTable 
                                key={`grade-${refreshKey}`}
                                showDefinitions={showDefinitions}
                                title="Grade Capacity Rules" 
                                description="Defines baseline expectations. Higher grades typically have more 'Points' to spend, allowing them to oversee more work."
                                logicDescription="The 'Weekly Points' sets the 100% capacity mark. 'Max Current' is the threshold where multitasking penalties begin."
                                formula="Utilization % = Total Load / Weekly Points"
                                data={localSettings.workload.gradeCapacities} 
                                onUpdate={(d) => updateWorkloadConfig('gradeCapacities', d)}
                                onAdd={() => handleAddRow('gradeCapacities', { grade: "New Grade", weeklyPoints: 5, maxCurrent: 3, maxTotal: 5, targetExecPct: 50, targetOversightPct: 50, budgetDetail: "", notes: "" })}
                                onDelete={(i) => handleDeleteRow('gradeCapacities', i)}
                                columns={[
                                    {key:'grade', label:'HR Grade', type:'text', help: 'Official job title/level. Duplicate names will cause issues.', width: 'w-48', isKey: true}, 
                                    {key:'weeklyPoints', label:'Points/Wk', type:'number', help: 'Capacity points per week (Denominator). Typical range 5-15.', min: 1, max: 50}, 
                                    {key:'maxCurrent', label:'Max Projects', type:'number', help: 'Concurrency limit. Exceeding this triggers penalty points.', min: 1, max: 20},
                                    {key:'maxTotal', label:'Max Pipeline', type:'number', help: 'Total limit including uncommitted pipeline work.', min: 1, max: 30},
                                    {key:'targetExecPct', label:'Exec %', type:'number', help: 'Guidance: Target % for hands-on execution.', min: 0, max: 100},
                                    {key:'targetOversightPct', label:'Oversight %', type:'number', help: 'Guidance: Target % for management/oversight.', min: 0, max: 100}
                                ]}
                            />
                        </div>
                        {/* ... (Other ConfigTables follow similar pattern) ... */}
                        <ConfigTable 
                            key={`role-${refreshKey}`}
                            showDefinitions={showDefinitions}
                            title="Role Weights" 
                            description="Multipliers applied based on the person's functional role on a specific project."
                            logicDescription="Differentiates accountability. A 'Director' (Weight 2.0) accrues double the load points of a 'Member' (Weight 1.0) for the same project."
                            formula="Load += Project Base × Role Weight"
                            data={localSettings.workload.roleWeights} 
                            onUpdate={(d) => updateWorkloadConfig('roleWeights', d)}
                            onAdd={() => handleAddRow('roleWeights', { role: "NEW", weight: 1.0, category: "Execution", notes: "" })}
                            onDelete={(i) => handleDeleteRow('roleWeights', i)}
                            columns={[
                                {key:'role', label:'Role Key', type:'text', help: 'Must match keys in Taxonomy > Roles.', isKey: true}, 
                                {key:'weight', label:'Multiplier', type:'number', help: 'Scalar value. 1.0 is baseline. Higher values increase load.', min: 0, max: 10}, 
                                {key:'category', label:'Category', type:'text', help: 'Grouping for analytics (Oversight vs Execution).'}
                            ]}
                        />
                        <ConfigTable 
                            key={`stage-${refreshKey}`}
                            showDefinitions={showDefinitions}
                            title="Lifecycle Multipliers" 
                            description="Probability weighting based on project phase."
                            logicDescription="Discounts pipeline work. A 'Proposal' might be 50% probability, so it only counts for half the load of an active project."
                            formula="Load *= Stage Multiplier"
                            data={localSettings.workload.stageMultipliers} 
                            onUpdate={(d) => updateWorkloadConfig('stageMultipliers', d)}
                            onAdd={() => handleAddRow('stageMultipliers', { lifecycleId: "L-NEW", multiplier: 0.5, isCommitted: false, notes: "" })}
                            onDelete={(i) => handleDeleteRow('stageMultipliers', i)}
                            columns={[
                                {key:'lifecycleId', label:'Lifecycle ID', type:'text', help: 'Must match Taxonomy > Lifecycle IDs (e.g., L-CUR).', isKey: true}, 
                                {key:'multiplier', label:'Probability', type:'number', help: 'Discount factor (0.0 to 1.0).', min: 0, max: 1}, 
                                {key:'isCommitted', label:'Committed?', type:'boolean', help: 'If checked, counts towards committed load stats.'}
                            ]}
                        />
                        <ConfigTable 
                            key={`complex-${refreshKey}`}
                            showDefinitions={showDefinitions}
                            title="Complexity Factors" 
                            description="Adjustments for project difficulty (1-5 scale)."
                            logicDescription="Increases load for difficult projects. A complexity 5 project adds 30% more load than a standard project."
                            formula="Load *= Complexity Factor"
                            data={localSettings.workload.complexityFactors} 
                            onUpdate={(d) => updateWorkloadConfig('complexityFactors', d)}
                            onAdd={() => handleAddRow('complexityFactors', { level: 6, factor: 1.0, notes: "" })}
                            onDelete={(i) => handleDeleteRow('complexityFactors', i)}
                            columns={[
                                {key:'level', label:'Level', type:'number', help: 'Complexity Score (1-5).', min: 1, max: 10, isKey: true}, 
                                {key:'factor', label:'Multiplier', type:'number', help: 'Scalar (e.g. 1.3 = +30% load).', min: 0.1, max: 5}, 
                                {key:'notes', label:'Guidance', type:'text', help: 'Description of this complexity level.'}
                            ]}
                        />
                        <ConfigTable 
                            key={`engine-${refreshKey}`}
                            showDefinitions={showDefinitions}
                            title="Engine Constants" 
                            description="Global thresholds and penalty values."
                            logicDescription="Fine-tune the sensitivity of the burnout algorithm."
                            data={localSettings.workload.burnoutConfig} 
                            onUpdate={(d) => updateWorkloadConfig('burnoutConfig', d)}
                            onAdd={() => handleAddRow('burnoutConfig', { key: "new_param", value: 0, unit: "", notes: "" })}
                            onDelete={(i) => handleDeleteRow('burnoutConfig', i)}
                            columns={[
                                {key:'key', label:'Parameter Key', type:'text', help: 'Internal system variable name.', isKey: true}, 
                                {key:'value', label:'Value', type:'number', help: 'Numeric setting.'}, 
                                {key:'notes', label:'Description', type:'text', help: 'What this controls.'}
                            ]}
                        />
                        <ConfigTable 
                            key={`alloc-${refreshKey}`}
                            showDefinitions={showDefinitions}
                            title="Default Allocations" 
                            description="Fallback % time allocation if not specified."
                            logicDescription="Used when a user is assigned to a project without an explicit % allocation."
                            data={localSettings.workload.defaultAllocations} 
                            onUpdate={(d) => updateWorkloadConfig('defaultAllocations', d)}
                            onAdd={() => handleAddRow('defaultAllocations', { role: "Role", percent: 50, notes: "" })}
                            onDelete={(i) => handleDeleteRow('defaultAllocations', i)}
                            columns={[
                                {key:'role', label:'Role', type:'text', help: 'Role Key.', isKey: true}, 
                                {key:'percent', label:'Default %', type:'number', help: 'Assumed allocation percentage.', min: 0, max: 100},
                                {key:'notes', label:'Notes', type:'text', help: 'Description.'}
                            ]}
                        />
                    </div>
                </div>
            )}

            {/* LOGIC TAB */}
            {activeTab === 'logic' && (
                <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
                    <LogicPanel 
                        icon={AlertOctagon}
                        title="Governance Health Logic"
                        description="The system automatically calculates a RAG (Red/Amber/Green) status for every project. This ensures objective reporting based on data freshness and risk exposure, rather than subjective PM sentiment."
                        formula="Health Score = 100 - (Risk Penalties + Governance Penalties)"
                        impact={getImpactSummary('logic')}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Risk Weights */}
                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-6">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-[var(--ink)] flex items-center gap-2">
                                <AlertOctagon size={16} className="text-[var(--risk)]"/> Risk Impact Penalties
                            </h3>
                            <p className="text-xs text-[var(--inkDim)]">Points deducted from project health for each open risk of this severity.</p>
                            
                            <div className="space-y-4 pt-2">
                                <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <label className="flex justify-between text-[10px] font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">
                                        <span>High Impact Risk</span>
                                        <span className="text-[var(--risk)]">-{localSettings.weights.health.impactWeight.High} pts</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="50" step="1"
                                        value={localSettings.weights.health.impactWeight.High} 
                                        onChange={(e) => updateNestedWeight('health', 'impactWeight', 'High', parseInt(e.target.value))} 
                                        className="w-full accent-[var(--risk)] h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <label className="flex justify-between text-[10px] font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">
                                        <span>Medium Impact Risk</span>
                                        <span className="text-[var(--warn)]">-{localSettings.weights.health.impactWeight.Medium} pts</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="30" step="1"
                                        value={localSettings.weights.health.impactWeight.Medium} 
                                        onChange={(e) => updateNestedWeight('health', 'impactWeight', 'Medium', parseInt(e.target.value))} 
                                        className="w-full accent-[var(--warn)] h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <label className="flex justify-between text-[10px] font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">
                                        <span>Low Impact Risk</span>
                                        <span className="text-[var(--safe)]">-{localSettings.weights.health.impactWeight.Low} pts</span>
                                    </label>
                                    <input 
                                        type="range" min="0" max="10" step="1"
                                        value={localSettings.weights.health.impactWeight.Low} 
                                        onChange={(e) => updateNestedWeight('health', 'impactWeight', 'Low', parseInt(e.target.value))} 
                                        className="w-full accent-[var(--safe)] h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Governance Penalties */}
                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-6">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-[var(--ink)] flex items-center gap-2">
                                <Shield size={16} className="text-[var(--accent)]"/> Governance Failure Penalties
                            </h3>
                            <p className="text-xs text-[var(--inkDim)]">Automatic deductions for process failures.</p>
                            
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Overdue Item</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">Risk or Action past due date</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.health.overduePenalty} 
                                        min={0} max={100}
                                        onChange={(v) => updateNestedWeight('health', 'direct', 'overduePenalty', v)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Blocked Status</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">Item marked as 'Blocked'</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.health.blockedPenalty} 
                                        min={0} max={100}
                                        onChange={(v) => updateNestedWeight('health', 'direct', 'blockedPenalty', v)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Missing Key Role</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">No PD/ED assigned</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.health.missingRolePenalty} 
                                        min={0} max={100}
                                        onChange={(v) => updateNestedWeight('health', 'direct', 'missingRolePenalty', v)} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Governance Rules & Reporting Thresholds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* New Governance Rules Section */}
                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-6">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-[var(--ink)] flex items-center gap-2">
                                <Activity size={16} className="text-[var(--warn)]"/> Risk & RAG Thresholds
                            </h3>
                            <p className="text-xs text-[var(--inkDim)]">Thresholds that trigger Amber/Red status automatically.</p>
                            
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Risk Volume Limit</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">Max open risks before Amber status</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.governance?.riskVolumeThreshold ?? 5} 
                                        min={1} max={50}
                                        onChange={(v) => updateNestedWeight('governance', 'direct', 'riskVolumeThreshold', v)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Critical Phase Report Age</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">Days allowed without report (Active Projects)</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.governance?.staleReportDaysCritical ?? 7} 
                                        min={1} max={30}
                                        onChange={(v) => updateNestedWeight('governance', 'direct', 'staleReportDaysCritical', v)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                    <div>
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Standard Phase Report Age</label>
                                        <p className="text-[9px] text-[var(--inkDim)]">Days allowed without report (Pipeline/Closed)</p>
                                    </div>
                                    <ConfigInput 
                                        type="number" 
                                        value={localSettings.weights.governance?.staleReportDaysStandard ?? 14} 
                                        min={1} max={90}
                                        onChange={(v) => updateNestedWeight('governance', 'direct', 'staleReportDaysStandard', v)} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Reporting Thresholds */}
                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] space-y-6">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-[var(--ink)] flex items-center gap-2">
                                <Clock size={16} className="text-[var(--safe)]"/> Lifecycle Expectation
                            </h3>
                            <p className="text-xs text-[var(--inkDim)]">Base update frequency expectation per lifecycle phase (affects health score calculation).</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(localSettings.weights.reporting.expectedUpdateDaysByLifecycle).map(([lifecycle, days]) => (
                                    <div key={lifecycle} className="bg-[var(--surface2)] p-4 rounded-xl border border-[var(--border)] text-center">
                                        <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">{lifecycle}</label>
                                        <div className="flex items-center justify-center gap-2">
                                            <ConfigInput 
                                                type="number" 
                                                value={days} 
                                                min={1} max={90}
                                                onChange={(v) => updateReportConfig(lifecycle, v)} 
                                            />
                                            <span className="text-xs font-bold text-[var(--inkDim)]">Days</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAXONOMY TAB */}
            {activeTab === 'taxonomy' && (
                <div className="space-y-8 animate-fade-in">
                    <LogicPanel 
                        icon={Layers}
                        title="Structural Taxonomy"
                        description="These lists define the core vocabulary of the system. Changing IDs here may break historical data links, so handle with care."
                        formula="Data Integrity = Strict Referential Key Matching"
                        impact={getImpactSummary('taxonomy')}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TaxonomyEditor title="Business Units" items={localSettings.taxonomy.units} onUpdate={(items) => updateTaxonomyList('units', items)} prefix="U" usageCheck={checkUnitUsage} description="Departments or Cost Centers."/>
                        <TaxonomyEditor title="Lifecycle Phases" items={localSettings.taxonomy.lifecycle} onUpdate={(items) => updateTaxonomyList('lifecycle', items)} prefix="L" usageCheck={checkLifecycleUsage} description="Project stages (Pipeline vs Active)."/>
                        <TaxonomyEditor title="Work Types" items={localSettings.taxonomy.workTypes} onUpdate={(items) => updateTaxonomyList('workTypes', items)} prefix="T" usageCheck={checkWorkTypeUsage} description="Classification (Proposal, Engagement)."/>
                        <TaxonomyEditor title="Staffing Roles" items={localSettings.taxonomy.roleKeys} onUpdate={(items) => updateTaxonomyList('roleKeys', items)} prefix="R" idField="key" usageCheck={checkRoleUsage} description="Functional roles on projects."/>
                        
                        <div className="lg:col-span-2">
                             <div className="flex flex-col h-[420px] rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden group hover:border-[var(--accent)]/30 transition-all">
                                <div className="flex justify-between items-center p-5 border-b border-[var(--border)] bg-[var(--surface)]">
                                    <h3 className="font-bold text-sm text-[var(--ink)] uppercase tracking-wide flex items-center gap-2">
                                        <LayoutTemplate size={14} className="text-[var(--accent)] opacity-70"/> RACI Template Rows
                                    </h3>
                                    <button onClick={() => updateRaciTemplate([...localSettings.templates.raciDecisionAreas, "New Decision Area"])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[10px] font-bold uppercase shadow-sm active:scale-95 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">
                                        <Plus size={12} /> Add
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-[var(--card)]">
                                    {localSettings.templates.raciDecisionAreas.map((area, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface2)] group/item transition-colors">
                                            <div className="w-8 text-center text-[var(--inkDim)] text-[10px] font-mono">{idx+1}</div>
                                            <input 
                                                value={area}
                                                onChange={(e) => {
                                                    const copy = [...localSettings.templates.raciDecisionAreas];
                                                    copy[idx] = e.target.value;
                                                    updateRaciTemplate(copy);
                                                }}
                                                className="flex-1 bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--ink)] py-1"
                                            />
                                            <button 
                                                onClick={() => updateRaciTemplate(localSettings.templates.raciDecisionAreas.filter((_, i) => i !== idx))}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--inkDim)] hover:bg-[var(--risk)] hover:text-white opacity-0 group-hover/item:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DATA TAB */}
            {activeTab === 'data' && (
                <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
                    <LogicPanel 
                        icon={Server}
                        title="Data Management Console"
                        description="Manage the application state directly. Create backups before making major changes. The 'Reset' function will purge all local data."
                        impact="Backups include all people, projects, config and history."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Backup / Restore */}
                        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><HardDrive size={20} className="text-[var(--accent)]"/> Backup & Restore</h3>
                                {lastSaveTime && (
                                    <div className="text-[10px] font-mono text-[var(--inkDim)] bg-[var(--surface2)] px-2 py-1 rounded flex items-center gap-1.5 animate-fade-in">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--safe)] animate-pulse"></div>
                                        Saved: {lastSaveTime.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-[var(--inkDim)] mb-6 leading-relaxed">Save a complete snapshot of the system state (People, Projects, Config) to a JSON file.</p>
                            <div className="flex gap-3">
                                 <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-colors">
                                     <Download size={16}/> Backup JSON
                                 </button>
                                 <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors">
                                     <Upload size={16}/> Restore JSON
                                 </button>
                                 <input type="file" ref={fileInputRef} onChange={handleRestoreFileSelect} className="hidden" accept=".json" />
                            </div>
                        </div>

                        {/* Reset */}
                        <div className="p-6 rounded-3xl border border-[var(--risk)] bg-[var(--card)] shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[var(--risk)] opacity-5 pointer-events-none transition-opacity group-hover:opacity-10"></div>
                            <h3 className="font-bold text-lg mb-4 text-[var(--risk)] flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h3>
                            <p className="text-xs text-[var(--inkDim)] mb-6 leading-relaxed">Resetting will wipe all local data and reload the default seed configuration. This action cannot be undone.</p>
                            <button onClick={handleFactoryReset} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--risk)] text-white rounded-xl text-xs font-bold uppercase hover:opacity-90 transition-opacity shadow-lg shadow-[var(--risk)]/20">
                                <RotateCcw size={16}/> Factory Reset
                            </button>
                        </div>
                    </div>

                    {/* Diagnostics */}
                    <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Terminal size={20} className="text-[var(--accent)]"/> System Diagnostics</h3>
                                <p className="text-xs text-[var(--inkDim)] mt-1">Scan database for integrity issues (zombie references, circular links).</p>
                            </div>
                            <button onClick={runDiagnostics} className="px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--bg)] font-bold text-xs uppercase hover:opacity-90 flex items-center gap-2">
                                <RefreshCw size={14}/> Run Scan
                            </button>
                        </div>
                        {diagnosticsLog && (
                            <div className="p-4 bg-[var(--bg)] rounded-xl border border-[var(--border)] font-mono text-[10px] max-h-60 overflow-y-auto custom-scrollbar">
                                {diagnosticsLog.map((log, i) => (
                                    <div key={i} className={`mb-1 ${log.includes('No issues') ? 'text-[var(--safe)]' : 'text-[var(--risk)]'}`}>
                                        {`> ${log}`}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
