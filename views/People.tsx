
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { Exporter } from '../services/exporter';
import { User, Search, Filter, Briefcase, Mail, LayoutGrid, List, Layers, ArrowRight, AlertTriangle, Network, Download, ChevronDown, ChevronRight, Edit2, Lock, Unlock, ZoomIn, ZoomOut, Maximize, UserPlus, Printer, Loader2, Image as ImageIcon, MapPin, Hash, Check, X, Calendar, Phone, FileSpreadsheet, Building2, Shield, UserCircle } from 'lucide-react';
import { Person, WorkloadScore } from '../types';
import { openDrawer, closeDrawer } from '../components/Drawer';
import { toast } from '../components/Toasts';
import { Avatar } from '../components/Shared';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type ViewMode = 'grid' | 'list' | 'grouped' | 'chart';

// ... (Existing Components: PersonCard, PersonRow, OrgNode, MobileOrgNode, OrgChart) ...
// NOTE: I am preserving the existing components above and only modifying the People component and its handleAddPerson function logic significantly.

export const PersonCard: React.FC<{ p: Person, score: WorkloadScore, fairness: any }> = ({ p, score, fairness }) => {
    const { state, dispatch } = useApp();
    const riskColor = score.risk === 'Red' ? 'var(--risk)' : score.risk === 'Amber' ? 'var(--warn)' : 'var(--safe)';

    return (
        <div 
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: p.id } })}
          className={`bg-[var(--card)] border rounded-2xl hover:border-[var(--accent)] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-[260px] shadow-sm hover:shadow-lg ${score.risk === 'Red' ? 'border-[var(--risk)]' : 'border-[var(--border)]'}`}
        >
            <div className="p-5 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-4">
                      <Avatar name={p.name} unitId={p.unitId} className="w-12 h-12 text-lg" />
                      <div className="text-right">
                          <span className="text-[10px] font-bold text-[var(--inkDim)] uppercase tracking-wider block">{Compute.unitName(state, p.unitId)}</span>
                          <span className="text-[9px] text-[var(--inkDim)] mt-1 inline-block bg-[var(--surface2)] px-1 rounded">{p.grade}</span>
                      </div>
                </div>
                
                <h3 className="font-bold text-[17px] text-[var(--ink)] leading-tight mb-1 group-hover:text-[var(--accent)] transition-colors">{p.name}</h3>
                <div className="text-xs text-[var(--inkDim)] font-medium line-clamp-1 mb-4">{p.title}</div>
                
                <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--inkDim)]">
                        <span>Burnout Score</span>
                        <span style={{color: riskColor}} className="font-bold">{score.finalScore.toFixed(1)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(score.utilizationPct, 100)}%`, backgroundColor: riskColor }}></div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--inkDim)]">
                        <div className="bg-[var(--surface2)] px-2 py-1 rounded flex justify-between">
                            <span>Comm.</span> 
                            <span className="font-mono text-[var(--ink)]">{score.committedLoad.toFixed(1)}</span>
                        </div>
                        <div className="bg-[var(--surface2)] px-2 py-1 rounded flex justify-between">
                            <span>Mgmt.</span>
                            <span className="font-mono text-[var(--ink)]">{score.mgmtLoad.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Fairness Flag */}
                    {fairness && fairness.status !== 'Balanced' && (
                        <div className={`text-[10px] font-bold flex items-center gap-1 ${fairness.status === 'Overloaded' ? 'text-[var(--risk)]' : 'text-[var(--warn)]'}`}>
                            <AlertTriangle size={10} /> {fairness.msg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PersonRow: React.FC<{ p: Person, score: WorkloadScore }> = ({ p, score }) => {
    const { dispatch } = useApp();
    const riskColor = score.risk === 'Red' ? 'var(--risk)' : score.risk === 'Amber' ? 'var(--warn)' : 'var(--safe)';

    return (
        <div 
           onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: p.id } })}
           className="flex items-center gap-4 p-4 border-b border-[var(--border2)] hover:bg-[var(--surface2)] cursor-pointer group transition-colors"
        >
            <Avatar name={p.name} unitId={p.unitId} className="w-10 h-10 text-xs shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">{p.name}</div>
                <div className="text-xs text-[var(--inkDim)] truncate">{p.title}</div>
            </div>
            <div className="w-24 hidden md:block">
                <div className="text-[10px] font-bold text-[var(--inkDim)] truncate">{p.grade}</div>
            </div>
            <div className="w-20 md:w-32 flex flex-col items-end shrink-0">
                <div className="text-xs font-bold font-mono" style={{color: riskColor}}>{score.utilizationPct.toFixed(0)}%</div>
                <div className="w-16 md:w-20 h-1 bg-[var(--surface2)] rounded-full mt-1 overflow-hidden hidden sm:block">
                     <div className="h-full rounded-full" style={{ width: `${Math.min(score.utilizationPct, 100)}%`, backgroundColor: riskColor }}></div>
                </div>
            </div>
            <ArrowRight size={16} className="text-[var(--inkDim)] opacity-0 group-hover:opacity-100 hidden sm:block" />
        </div>
    );
};

const OrgNode: React.FC<{ node: Person & { children: any[] }, depth: number, isEditing: boolean, scoresById: Record<string, WorkloadScore> }> = ({ node, depth, isEditing, scoresById }) => {
    const { state, dispatch } = useApp();
    const [expanded, setExpanded] = useState(true);
    const [showTooltip, setShowTooltip] = useState(false);
    
    const score = scoresById[node.id] || { utilizationPct: 0, finalScore: 0, effectiveCap: 10, risk: 'Green' };
    const riskColor = score.risk === 'Red' ? 'var(--risk)' : score.risk === 'Amber' ? 'var(--warn)' : 'var(--safe)';

    const handleReassign = (e: React.MouseEvent) => {
        e.stopPropagation();
        openDrawer({
            title: "Reassign Manager",
            sub: `Change reporting line for ${node.name}`,
            saveLabel: "Update Manager",
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-[var(--inkDim)]">Current Manager: <span className="font-bold text-[var(--ink)]">{node.formalManagerId ? (state.people.find(p=>p.id===node.formalManagerId)?.name || node.formalManagerId) : 'None'}</span></p>
                    <div>
                        <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">New Manager</label>
                        <select id="new-manager" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none">
                            <option value="">-- No Manager --</option>
                            <option value="Board">Board</option>
                            {state.people.filter(p => p.id !== node.id).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ),
            onSave: () => {
                const newMgr = (document.getElementById('new-manager') as HTMLSelectElement).value || null;
                dispatch({ type: 'UPDATE_PERSON', payload: { ...node, formalManagerId: newMgr } });
                toast("Structure Updated", `${node.name} moved successfully`, "success");
                closeDrawer();
            }
        });
    };

    return (
        <div className="flex flex-col items-center animate-fade-in relative">
            <div 
                className={`
                    relative flex flex-col items-center p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] 
                    shadow-sm transition-all z-10 w-[220px] 
                    ${isEditing ? 'border-dashed border-[var(--accent)]' : 'hover:shadow-md hover:border-[var(--accent)] cursor-pointer'}
                    ${node.id === 'MP' ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : ''}
                `}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => !isEditing && dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: node.id } })}
            >
                {showTooltip && !isEditing && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[var(--surface)] border border-[var(--border)] p-3 rounded-xl shadow-xl z-50 pointer-events-none animate-scale-in no-export">
                        <div className="flex justify-between text-xs mb-1 text-[var(--ink)]">
                            <span className="font-bold">Utilization</span>
                            <span className="font-mono font-bold" style={{color:riskColor}}>{score.utilizationPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(score.utilizationPct, 100)}%`, backgroundColor: riskColor }}></div>
                        </div>
                        <div className="text-[10px] text-[var(--inkDim)] flex justify-between">
                            <span>Load: {score.finalScore.toFixed(1)}</span>
                            <span>Cap: {score.effectiveCap.toFixed(1)}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 w-full">
                    <Avatar name={node.name} unitId={node.unitId} className="w-9 h-9 text-[10px] shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                        <div className="font-bold text-xs truncate text-[var(--ink)]">{node.name}</div>
                        <div className="text-[9px] text-[var(--inkDim)] truncate">{node.title}</div>
                    </div>
                    {isEditing && (
                        <button onClick={handleReassign} className="p-1.5 bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white rounded text-[var(--inkDim)] transition-colors shadow-sm no-export" title="Change Manager">
                            <Edit2 size={12} />
                        </button>
                    )}
                </div>
                {node.children.length > 0 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="absolute -bottom-3 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--inkDim)] hover:text-[var(--ink)] z-20 shadow-sm transition-transform hover:scale-110 no-export"
                    >
                        {expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                    </button>
                )}
            </div>
            
            {expanded && node.children.length > 0 && (
                <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-[var(--border)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[var(--accent)] -translate-y-full animate-[flow_2s_infinite] no-export"></div>
                    </div>
                    <div className="flex gap-4 items-start relative px-4">
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-[50%] -translate-x-1/2 h-px bg-[var(--border)]" 
                                style={{
                                    width: `calc(100% - ${220 + 32}px)`,
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                }}
                            ></div>
                        )}
                        <div className="flex gap-8 pt-6 border-t-0 border-[var(--border)]">
                             {node.children.map((child, idx) => (
                                <div key={child.id} className="relative">
                                    <div className="absolute -top-6 left-1/2 w-px h-6 bg-[var(--border)] -translate-x-1/2"></div>
                                    <OrgNode node={child} depth={depth + 1} isEditing={isEditing} scoresById={scoresById} />
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MobileOrgNode: React.FC<{ node: Person & { children: any[] }, depth: number }> = ({ node, depth }) => {
    const { dispatch } = useApp();
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <div className="flex flex-col animate-slide-up">
            <div 
                className="flex items-center justify-between p-3 border-b border-[var(--border2)] bg-[var(--card)] active:bg-[var(--surface2)]"
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: node.id } })}
            >
                <div className="flex items-center gap-3">
                    <Avatar name={node.name} unitId={node.unitId} className="w-8 h-8 text-[10px]" />
                    <div>
                        <div className="text-sm font-bold text-[var(--ink)]">{node.name}</div>
                        <div className="text-[10px] text-[var(--inkDim)]">{node.title}</div>
                    </div>
                </div>
                {node.children.length > 0 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-2 text-[var(--inkDim)]"
                    >
                        {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                    </button>
                )}
            </div>
            {isOpen && node.children.map(child => (
                <MobileOrgNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );
};

const OrgChart: React.FC<{ scoresById: Record<string, WorkloadScore> }> = ({ scoresById }) => {
    const { state } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [scale, setScale] = useState(0.8);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const isDown = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const scrollLeft = useRef(0);
    const scrollTop = useRef(0);
    
    const hierarchy = useMemo(() => {
        const map: Record<string, any> = {};
        state.people.forEach(p => map[p.id] = { ...p, children: [] });
        const roots: any[] = [];
        state.people.forEach(p => {
            if (p.formalManagerId && map[p.formalManagerId]) {
                map[p.formalManagerId].children.push(map[p.id]);
            } else {
                roots.push(map[p.id]);
            }
        });
        return roots;
    }, [state.people]);

    const handleExportCsv = () => {
        const data = state.people.map(p => {
            const manager = state.people.find(m => m.id === p.formalManagerId);
            return {
                ID: p.id,
                Name: p.name,
                Title: p.title,
                Unit: Compute.unitName(state, p.unitId),
                Grade: p.grade,
                'Manager Name': manager ? manager.name : (p.formalManagerId || ''),
                'Manager ID': p.formalManagerId || ''
            };
        });
        Exporter.exportToCsv(data, 'Organization_Structure.csv');
        toast("Download Ready", "Org structure data exported", "success");
    };

    // Auto-center on load
    useEffect(() => {
        if (!isMobile && containerRef.current && contentRef.current) {
             const contW = containerRef.current.offsetWidth;
             const contentW = contentRef.current.scrollWidth;
             if (contentW > contW) {
                 containerRef.current.scrollLeft = (contentW - contW) / 2;
             }
        }
    }, [hierarchy, isMobile]);

    // Drag-to-scroll
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current || isMobile) return;
        isDown.current = true;
        containerRef.current.style.cursor = 'grabbing';
        containerRef.current.style.userSelect = 'none';
        
        startX.current = e.pageX - containerRef.current.offsetLeft;
        startY.current = e.pageY - containerRef.current.offsetTop;
        scrollLeft.current = containerRef.current.scrollLeft;
        scrollTop.current = containerRef.current.scrollTop;
    };

    const handleMouseLeave = () => {
        isDown.current = false;
        if(containerRef.current) {
            containerRef.current.style.cursor = 'grab';
            containerRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseUp = () => {
        isDown.current = false;
        if(containerRef.current) {
            containerRef.current.style.cursor = 'grab';
            containerRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !containerRef.current || isMobile) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const y = e.pageY - containerRef.current.offsetTop;
        const walkX = (x - startX.current) * 1.5; 
        const walkY = (y - startY.current) * 1.5;
        containerRef.current.scrollLeft = scrollLeft.current - walkX;
        containerRef.current.scrollTop = scrollTop.current - walkY;
    };

    if (isMobile) {
        return (
            <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface2)] flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-[var(--inkDim)]">Organization Hierarchy</span>
                    <button className="text-[var(--accent)] text-[10px] font-bold uppercase">Expand All</button>
                </div>
                <div>
                    {hierarchy.map(root => (
                        <MobileOrgNode key={root.id} node={root} depth={0} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[700px] border border-[var(--border)] rounded-3xl bg-[var(--surface2)] relative overflow-hidden shadow-inner group">
            
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-30 flex gap-2 no-export">
                <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-2 hover:bg-[var(--surface2)] border-r border-[var(--border)]"><ZoomOut size={14}/></button>
                    <button onClick={() => setScale(0.8)} className="p-2 hover:bg-[var(--surface2)] border-r border-[var(--border)]"><Maximize size={14}/></button>
                    <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="p-2 hover:bg-[var(--surface2)]"><ZoomIn size={14}/></button>
                </div>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm transition-all border ${isEditing ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]' : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)]'}`}
                >
                    {isEditing ? <Unlock size={14}/> : <Lock size={14}/>}
                    {isEditing ? 'Exit Edit' : 'Edit Structure'}
                </button>
                
                <button 
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface2)] transition-colors shadow-sm"
                    title="Export Data"
                >
                    <FileSpreadsheet size={14}/> <span className="text-[10px] font-bold uppercase">Export Data</span>
                </button>
            </div>

            {/* Warning Banner */}
            {isEditing && (
                <div className="absolute top-4 left-4 z-30 bg-[var(--risk)]/10 border border-[var(--risk)]/30 text-[var(--risk)] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up no-export">
                    <AlertTriangle size={14}/> Editing Active: Changes apply immediately.
                </div>
            )}

            {/* Chart Container */}
            <div 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="flex-1 overflow-auto custom-scrollbar cursor-grab bg-[radial-gradient(var(--border2)_1px,transparent_1px)] [background-size:20px_20px] relative"
            >
                <div id="org-chart-content" ref={contentRef} className="min-w-fit min-h-fit p-20 flex justify-center items-start m-auto">
                    <div className="transform transition-transform origin-top" style={{ transform: `scale(${scale})` }}>
                        <div className="flex gap-16">
                            {hierarchy.map(root => (
                                <OrgNode key={root.id} node={root} depth={0} isEditing={isEditing} scoresById={scoresById} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes flow { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
            `}</style>
        </div>
    );
};

export const People: React.FC = () => {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Calculate Scores ONCE for the entire view
  const scoresById = useMemo(() => Compute.calculateAllWorkloadScores(state), [state]);

  const filteredPeople = useMemo(() => {
      return state.people.filter(p => {
          if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (filterUnit && p.unitId !== filterUnit) return false;
          return true;
      });
  }, [state.people, search, filterUnit]);

  const groupedPeople = useMemo((): Record<string, Person[]> => {
      const groups: Record<string, Person[]> = {};
      filteredPeople.forEach(p => {
          const unitName = Compute.unitName(state, p.unitId);
          if (!groups[unitName]) groups[unitName] = [];
          groups[unitName].push(p);
      });
      return groups;
  }, [filteredPeople, state]);

  // Handle Add Person via Drawer
  const handleAddPerson = () => {
      openDrawer({
          title: "Onboard Team Member",
          sub: "Create new profile and assign capacity",
          saveLabel: "Create Profile",
          content: (
              <div className="space-y-8 animate-fade-in pb-4">
                  {/* Name Input - Hero Style */}
                  <div className="group relative pt-4">
                      <input 
                        id="new-person-name" 
                        type="text" 
                        className="peer w-full bg-transparent border-b-2 border-[var(--border)] py-3 text-xl font-bold text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-transparent" 
                        placeholder="Full Name" 
                        autoComplete="off"
                        autoFocus
                      />
                      <label className="absolute left-0 top-0 text-[10px] font-mono text-[var(--accent)] uppercase transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-lg peer-placeholder-shown:text-[var(--inkDim)] peer-placeholder-shown:font-sans peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-mono peer-focus:text-[var(--accent)] pointer-events-none font-bold">
                          Full Name
                      </label>
                  </div>

                  {/* Title Input */}
                  <div>
                      <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase font-bold flex items-center gap-1">
                          <UserCircle size={12}/> Job Title
                      </label>
                      <input 
                        id="new-person-title" 
                        type="text" 
                        className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 text-sm font-bold outline-none focus:border-[var(--accent)] placeholder:text-[var(--inkDim)]/50"
                        placeholder="e.g. Senior Associate"
                      />
                  </div>

                  {/* Classification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Unit Select */}
                      <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold flex items-center gap-1">
                              <Building2 size={12}/> Business Unit
                          </label>
                          <div className="relative">
                              <select id="new-person-unit" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 pl-4 pr-10 text-sm font-bold outline-none focus:border-[var(--ink)] appearance-none cursor-pointer hover:bg-[var(--surface)] transition-colors">
                                  {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-4 text-[var(--inkDim)] pointer-events-none"/>
                          </div>
                      </div>

                      {/* Grade Select */}
                      <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold flex items-center gap-1">
                              <Shield size={12}/> HR Grade
                          </label>
                          <div className="relative">
                              <select id="new-person-grade" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 pl-4 pr-10 text-sm font-bold outline-none focus:border-[var(--ink)] appearance-none cursor-pointer hover:bg-[var(--surface)] transition-colors">
                                  {state.settings.workload.gradeCapacities.map(g => <option key={g.grade} value={g.grade}>{g.grade}</option>)}
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-4 text-[var(--inkDim)] pointer-events-none"/>
                          </div>
                      </div>
                  </div>
              </div>
          ),
          onSave: () => {
              const nameEl = document.getElementById('new-person-name') as HTMLInputElement;
              const titleEl = document.getElementById('new-person-title') as HTMLInputElement;
              const unitEl = document.getElementById('new-person-unit') as HTMLSelectElement;
              const gradeEl = document.getElementById('new-person-grade') as HTMLSelectElement;

              if(!nameEl.value) {
                  toast("Validation Error", "Name is required", "error");
                  return;
              }

              // Generate a safe unique code/id
              const initials = nameEl.value.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,3);
              const uniqueId = `${initials}-${Date.now().toString().substr(-4)}`;

              const newPerson: Person = {
                  id: uniqueId,
                  code: uniqueId,
                  name: nameEl.value,
                  title: titleEl.value || "Team Member",
                  unitId: unitEl.value,
                  grade: gradeEl.value,
                  formalManagerId: null,
                  dottedManagerId: null,
                  profile: {
                      availability: "Active",
                      capacityTarget: 4.0, // Default legacy
                      capacityModifier: 10, // Full capacity default
                      skills: [],
                      notes: "Newly onboarded via Cockpit",
                      recurringRoles: [],
                      directReports: []
                  }
              };

              dispatch({ type: 'ADD_PERSON', payload: newPerson });
              toast("Member Added", `${nameEl.value} has been added to the organization`, "success");
              closeDrawer();
          }
      });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
       {/* ... (Existing JSX for layout, header, filters etc.) ... */}
       <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
           <div>
               <h2 className="font-disp font-bold text-3xl tracking-tight text-[var(--ink)]">People & Organization</h2>
               <p className="text-sm text-[var(--inkDim)] mt-1 font-mono">Workforce directory • {filteredPeople.length} members active</p>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3">
               <div className="flex bg-[var(--surface2)] p-1 rounded-xl border border-[var(--border)] sm:mr-2 self-start sm:self-auto">
                   <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode==='grid' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)]'}`} title="Grid View"><LayoutGrid size={16}/></button>
                   <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode==='list' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)]'}`} title="List View"><List size={16}/></button>
                   <button onClick={() => setViewMode('grouped')} className={`p-2 rounded-lg transition-all ${viewMode==='grouped' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)]'}`} title="Group by Unit"><Layers size={16}/></button>
                   <button onClick={() => setViewMode('chart')} className={`p-2 rounded-lg transition-all ${viewMode==='chart' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)]'}`} title="Org Chart"><Network size={16}/></button>
               </div>

               {viewMode !== 'chart' && (
                   <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full sm:w-auto">
                       <div className="relative group flex-1">
                           <input 
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder="Search directory..."
                              className="w-full sm:w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                           />
                           <Search size={16} className="absolute left-3 top-2.5 text-[var(--inkDim)] group-focus-within:text-[var(--accent)] transition-colors"/>
                       </div>
                       
                       {/* Add Member Button */}
                       <button 
                           onClick={handleAddPerson}
                           className="flex items-center gap-2 px-4 py-2.5 bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 rounded-xl text-xs font-bold uppercase shadow-sm transition-all whitespace-nowrap"
                       >
                           <UserPlus size={16} /> <span className="hidden sm:inline">Add Member</span>
                       </button>

                       <div className="relative flex-1 sm:flex-none">
                           <select 
                              value={filterUnit}
                              onChange={e => setFilterUnit(e.target.value)}
                              className="w-full h-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-8 py-2.5 sm:py-0 text-sm outline-none focus:border-[var(--accent)] appearance-none cursor-pointer min-w-[150px] font-bold text-[var(--ink)]"
                           >
                               <option value="" className="bg-[var(--surface)] text-[var(--ink)]">All Units</option>
                               {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id} className="bg-[var(--surface)] text-[var(--ink)]">{u.name}</option>)}
                           </select>
                           <Filter size={16} className="absolute left-3 top-2.5 sm:top-[11px] text-[var(--inkDim)]"/>
                       </div>
                   </div>
               )}
           </div>
       </div>

       {viewMode === 'chart' ? (
           <OrgChart scoresById={scoresById} />
       ) : viewMode === 'grouped' ? (
           <div className="space-y-12">
               {Object.entries(groupedPeople).map(([unit, people]: [string, Person[]]) => (
                   <div key={unit} className="animate-fade-in">
                       <div className="flex items-center gap-3 mb-6">
                           <h3 className="font-bold text-lg text-[var(--ink)]">{unit}</h3>
                           <span className="bg-[var(--surface2)] text-[var(--inkDim)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)]">{people.length} Staff</span>
                           <div className="h-px flex-1 bg-[var(--border2)]"></div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                           {people.map(p => (
                               <PersonCard 
                                   key={p.id} 
                                   p={p} 
                                   score={scoresById[p.id]} 
                                   fairness={Compute.checkFairnessFromScores(p.id, state, scoresById)}
                               />
                           ))}
                       </div>
                   </div>
               ))}
           </div>
       ) : viewMode === 'list' ? (
           <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm animate-fade-in">
               {filteredPeople.map(p => (
                   <PersonRow 
                       key={p.id} 
                       p={p} 
                       score={scoresById[p.id]} 
                   />
               ))}
               {filteredPeople.length === 0 && <div className="p-10 text-center text-[var(--inkDim)] italic">No people found.</div>}
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
              {filteredPeople.map(p => (
                  <PersonCard 
                      key={p.id} 
                      p={p} 
                      score={scoresById[p.id]} 
                      fairness={Compute.checkFairnessFromScores(p.id, state, scoresById)}
                  />
              ))}
              {filteredPeople.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--inkDim)]">
                      <User size={48} className="mb-4 opacity-20" />
                      <p className="font-bold">No results found</p>
                      <button onClick={() => { setSearch(''); setFilterUnit(''); }} className="mt-4 px-4 py-2 bg-[var(--surface2)] rounded-lg text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-white transition-colors">Clear Filters</button>
                  </div>
              )}
           </div>
       )}
    </div>
  );
};
