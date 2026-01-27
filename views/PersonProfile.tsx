
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { ArrowLeft, Save, Briefcase, Network, Activity, Zap, Users, Shield, Clock, Award, AlertTriangle, Edit2, X, Check, Info, Mail, Hash, Calendar, Phone, HelpCircle } from 'lucide-react';
import { toast } from '../components/Toasts';
import { ResponsiveContainer, PieChart, Pie, Cell, Label, BarChart, Bar, XAxis, YAxis } from 'recharts';

// Avatar component reused for consistency
const getUnitColor = (unitId: string) => {
    switch(unitId) {
        case 'U-GG': return 'bg-emerald-600 border-emerald-500 text-emerald-50'; 
        case 'U-TA': return 'bg-indigo-600 border-indigo-500 text-indigo-50';
        case 'U-CS': return 'bg-blue-600 border-blue-500 text-blue-50';
        case 'U-PDM': return 'bg-amber-600 border-amber-500 text-amber-50';
        case 'U-CM': return 'bg-slate-700 border-slate-600 text-slate-50';
        default: return 'bg-slate-500 border-slate-400 text-white';
    }
};

const BigAvatar = ({ name, unitId }: { name: string, unitId: string }) => {
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colorClass = getUnitColor(unitId);
    return (
        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl ${colorClass} flex items-center justify-center text-3xl sm:text-5xl font-black border-[6px] border-[var(--bg)] shadow-2xl relative z-10 transition-all`}>
            {initials}
        </div>
    );
};

// --- Tag Input Component ---
const TagInput = ({ 
    label, 
    value, 
    onChange, 
    options = [] 
}: { 
    label: string, 
    value: string[], 
    onChange: (val: string[]) => void, 
    options?: string[] 
}) => {
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput('');
        setIsOpen(false);
    };

    const removeTag = (tag: string) => {
        onChange(value.filter(t => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(input);
        }
    };

    const availableOptions = options.filter(opt => !value.includes(opt) && opt.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">{label}</label>
            <div className="flex flex-wrap gap-2 p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl min-h-[52px] focus-within:border-[var(--accent)] transition-colors relative">
                {value.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold text-[var(--ink)] animate-scale-in">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--risk)] transition-colors"><X size={12} /></button>
                    </span>
                ))}
                <div className="relative flex-1 min-w-[120px]">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => { setInput(e.target.value); setIsOpen(true); }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                        className="w-full bg-transparent outline-none text-sm h-full placeholder:text-[var(--inkDim)]/50"
                        placeholder={value.length === 0 ? "Type and press Enter..." : "Add..."}
                    />
                    {isOpen && availableOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar">
                            {availableOptions.map(opt => (
                                <button 
                                    key={opt} 
                                    type="button"
                                    onClick={() => addTag(opt)}
                                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--surface2)] transition-colors block text-[var(--ink)] border-b border-[var(--border2)] last:border-0 font-medium"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const PersonProfile: React.FC = () => {
  const { state, dispatch } = useApp();
  const pid = state.ui.activePersonId;
  const person = state.people.find(p => p.id === pid);
  const [isEditing, setIsEditing] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  
  // Local state
  const [localCapMod, setLocalCapMod] = useState(10);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Access Control
  const tier = Compute.getAccessLevel(state.ui.currentUser);
  const canEdit = tier <= 2; 

  useEffect(() => {
      if(person) {
          setLocalCapMod(person.profile.capacityModifier || 10);
          if (isEditing) {
              setEditSkills(person.profile.skills || []);
              setEditRoles(person.profile.recurringRoles || []);
          }
      }
  }, [person, isEditing]);

  // Compute workload scores for the current state to facilitate fairness analysis
  const scoresById = useMemo(() => Compute.calculateAllWorkloadScores(state), [state]);

  if (!person) return <div>Person not found</div>;

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      
      const getVal = (name: string) => {
          const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          return el ? el.value : '';
      };

      const newProfile = {
          ...person.profile,
          capacityModifier: localCapMod,
          availability: getVal('availability'),
          skills: editSkills, // Use local state
          notes: getVal('notes'),
          transitionNotes: getVal('transitionNotes'),
          recurringRoles: editRoles // Use local state
      };

      const formalManager = getVal('formalManager') || null;
      const dottedManager = getVal('dottedManager') || null;
      
      dispatch({ type: 'UPDATE_PERSON', payload: { ...person, formalManagerId: formalManager, dottedManagerId: dottedManager, profile: newProfile } });
      toast("Profile Updated", "Changes saved to local store", "success");
      setIsEditing(false);
  };

  // Create a temporary person object to calculate score based on slider drag
  const tempPerson = {
      ...person,
      profile: { ...person.profile, capacityModifier: localCapMod }
  };
  const score = Compute.calculateWorkloadScore(tempPerson, state);
  const riskColor = score.risk === 'Red' ? 'var(--risk)' : score.risk === 'Amber' ? 'var(--warn)' : 'var(--safe)';
  
  // Use the correct Compute helper method for fairness checks
  const fairness = Compute.checkFairnessFromScores(person.id, state, scoresById);

  // Data for Donut chart
  const donutValue = Math.min(score.utilizationPct, 100);
  const donutData = [
      { name: 'Utilized', value: donutValue },
      { name: 'Remaining', value: Math.max(0, 100 - donutValue) }
  ];
  
  // Role Data for Bar Chart
  const roleData = Object.entries(score.breakdown.roles).map(([k,v]) => ({ name: k, value: v })).filter(x => x.value > 0);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // --- Display Components ---
  const InfoRow = ({ label, value, icon: Icon }: { label: string, value: string | React.ReactNode, icon: any }) => (
      <div className="flex items-start gap-4 p-3 hover:bg-[var(--surface)]/50 rounded-xl transition-colors">
          <div className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--inkDim)] shrink-0">
              <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-[var(--inkDim)] uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-sm font-bold text-[var(--ink)] break-words">{value}</div>
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
        {/* HERO BANNER - Improved fluid layout */}
        <div className="relative mb-8 md:mb-12">
            {/* Banner Background */}
            <div className="h-48 sm:h-64 bg-[var(--surface2)] border-b border-[var(--border)] rounded-b-[2rem] sm:rounded-b-[3rem] relative overflow-hidden shadow-inner">
                <div 
                    className="absolute inset-0 opacity-10" 
                    style={{
                        backgroundImage: `radial-gradient(var(--inkDim) 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                    }}
                ></div>
                {/* Subtle Accent Glow */}
                <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-[var(--accent)] opacity-[0.07] blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                    <button onClick={() => dispatch({ type: 'GO_BACK' })} 
                        className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface2)] transition-colors text-[var(--ink)] shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </div>
            
            {/* Content Container - overlapping banner */}
            <div className="px-6 sm:px-10 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 text-center md:text-left">
                <BigAvatar name={person.name} unitId={person.unitId} />
                
                <div className="flex-1 min-w-0 pb-2">
                    <h1 className="font-disp font-black text-3xl sm:text-5xl text-[var(--ink)] tracking-tight leading-none mb-3 drop-shadow-sm truncate px-2 md:px-0">{person.name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 text-sm font-bold text-[var(--inkDim)]">
                        <span className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm text-[var(--ink)] whitespace-nowrap">
                            <Briefcase size={14} className="text-[var(--accent)]"/> {person.title}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm whitespace-nowrap">
                            <Shield size={14}/> {person.grade}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm uppercase tracking-wide text-xs whitespace-nowrap">
                            <Hash size={12}/> {Compute.unitName(state, person.unitId)}
                        </span>
                    </div>
                </div>

                <div className="pb-2 flex gap-3 self-center md:self-end mt-2 md:mt-0">
                     {canEdit && (
                         <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`
                                px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95
                                ${isEditing 
                                    ? 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]' 
                                    : 'bg-[var(--ink)] text-[var(--bg)] border border-transparent'}
                            `}
                        >
                            {isEditing ? <><X size={16}/> Cancel</> : <><Edit2 size={16}/> Edit Profile</>}
                         </button>
                     )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6">
            
            {/* LEFT COLUMN (Summary & Workload) */}
            <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
                
                {/* WORKLOAD INTELLIGENCE CARD */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm relative overflow-hidden group">
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--surface2),_transparent)] opacity-50"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--accent)]"><Zap size={20} /></div>
                            <div>
                                <h3 className="font-bold text-lg">Workload Intelligence</h3>
                                <p className="text-xs text-[var(--inkDim)]">Real-time capacity analysis</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowExplainer(!showExplainer)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${showExplainer ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--inkDim)] hover:bg-[var(--surface2)]'}`}
                        >
                            <HelpCircle size={12}/> Explain Score
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-center">
                        {/* Donut Chart Side */}
                        <div className="flex flex-col items-center justify-center">
                             <div className="w-48 h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={donutData} 
                                            innerRadius={65} 
                                            outerRadius={80} 
                                            startAngle={90} 
                                            endAngle={-270} 
                                            dataKey="value"
                                            stroke="none"
                                            animationBegin={200}
                                            animationDuration={1000}
                                        >
                                            <Cell key="util" fill={riskColor} />
                                            <Cell key="rem" fill="var(--surface2)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-4xl font-black font-disp tracking-tighter animate-scale-in" style={{color: riskColor}}>{score.utilizationPct.toFixed(0)}%</span>
                                    <span className="text-[10px] font-bold text-[var(--inkDim)] uppercase tracking-widest mt-1">Load</span>
                                </div>
                             </div>
                        </div>

                        {/* Breakdown Side */}
                        <div className="space-y-6">
                            
                            {/* Linear Load Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-end text-[10px] font-bold text-[var(--inkDim)] uppercase tracking-wide">
                                    <span>Load vs Effective Capacity</span>
                                    <span>{score.finalScore.toFixed(1)} / {score.effectiveCap.toFixed(1)} pts</span>
                                </div>
                                <div className="w-full h-3 bg-[var(--surface2)] rounded-full overflow-hidden border border-[var(--border2)]">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${Math.min((score.finalScore / score.effectiveCap) * 100, 100)}%`, backgroundColor: riskColor }}
                                    ></div>
                                </div>
                            </div>

                            {/* DETAILED SCORE BREAKDOWN TABLE */}
                            <div className="bg-[var(--surface2)]/50 rounded-xl border border-[var(--border2)] overflow-hidden">
                                <div className="px-3 py-2 bg-[var(--surface2)] border-b border-[var(--border2)] flex justify-between items-center">
                                    <span className="text-[9px] font-bold uppercase text-[var(--inkDim)] tracking-wider">Score Component</span>
                                    <span className="text-[9px] font-bold uppercase text-[var(--inkDim)] tracking-wider">Points</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    <div className="flex justify-between px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors text-xs">
                                        <span className="text-[var(--ink)] font-medium">Committed Work</span>
                                        <span className="font-mono text-[var(--inkDim)]">{score.committedLoad.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors text-xs">
                                        <span className="text-[var(--ink)] font-medium">Pipeline Work</span>
                                        <span className="font-mono text-[var(--inkDim)]">{score.pipelineLoad.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between px-2 py-1 rounded hover:bg-[var(--surface)] transition-colors text-xs">
                                        <span className="text-[var(--ink)] font-medium">Management Overhead</span>
                                        <span className="font-mono text-[var(--inkDim)]">{score.mgmtLoad.toFixed(2)}</span>
                                    </div>
                                    {score.penaltyPoints > 0 && (
                                        <div className="flex justify-between px-2 py-1 rounded bg-[var(--risk)]/10 text-[var(--risk)] text-xs border border-[var(--risk)]/20 mt-1">
                                            <span className="font-bold flex items-center gap-1"><AlertTriangle size={10}/> Context Penalty</span>
                                            <span className="font-mono font-bold">+{score.penaltyPoints.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="px-3 py-2 bg-[var(--surface)] border-t border-[var(--border2)] flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase text-[var(--ink)]">Total Load Score</span>
                                    <span className="text-sm font-black font-mono text-[var(--ink)]">{score.finalScore.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Role Composition */}
                            <div>
                                <div className="text-[10px] text-[var(--inkDim)] uppercase mb-2 flex justify-between">
                                    <span>Role Breakdown</span>
                                </div>
                                <div className="flex w-full h-3 rounded-full overflow-hidden bg-[var(--surface2)]">
                                    {roleData.map((d, i) => (
                                        <div key={d.name} className="h-full hover:opacity-80 transition-opacity relative group/bar" 
                                             style={{width: `${(d.value / score.finalScore) * 100}%`, backgroundColor: COLORS[i % COLORS.length]}}
                                             title={`${d.name}: ${d.value.toFixed(1)}`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {roleData.map((d, i) => (
                                        <div key={d.name} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                            <span className="text-[10px] text-[var(--inkDim)] font-medium">{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* EXPLAINER PANEL */}
                    {showExplainer && (
                        <div className="mt-6 pt-6 border-t border-[var(--border)] animate-slide-up">
                            <h4 className="text-xs font-bold uppercase mb-3 flex items-center gap-2"><HelpCircle size={14}/> Calculation Logic</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-3 rounded-xl border ${score.penaltyPoints > 0 ? 'bg-[var(--risk)]/5 border-[var(--risk)]/20' : 'bg-[var(--surface2)] border-[var(--border)]'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-bold uppercase ${score.penaltyPoints > 0 ? 'text-[var(--risk)]' : 'text-[var(--inkDim)]'}`}>Context Switching</span>
                                        <span className="font-mono text-xs font-bold">{score.breakdown.items} Projects</span>
                                    </div>
                                    <div className="text-xs text-[var(--inkDim)] leading-tight">
                                        {score.penaltyPoints > 0 
                                            ? `Penalty active. Concurrent project count exceeds limit, adding +${score.penaltyPoints.toFixed(1)} load points.`
                                            : "Within concurrency limits. No penalty applied."}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-[var(--inkDim)]">Management Tax</span>
                                        <span className="font-mono text-xs font-bold">+{score.mgmtLoad.toFixed(1)} pts</span>
                                    </div>
                                    <div className="text-xs text-[var(--inkDim)] leading-tight">
                                        Calculated based on direct reporting lines and oversight responsibilities.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {fairness && fairness.status !== 'Balanced' && (
                        <div className={`mt-6 pt-4 border-t border-[var(--border2)] flex items-center gap-2 text-xs font-bold ${fairness.status === 'Overloaded' ? 'text-[var(--risk)]' : 'text-[var(--warn)]'}`}>
                            <Shield size={14} /> {fairness.msg}
                        </div>
                    )}
                </div>

                {/* PROJECTS LIST */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--card)]">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--accent)]"><Briefcase size={20} /></div>
                        <h3 className="font-bold text-lg">Active Assignments</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                         {state.workItems.filter(w => w.staffing.some(s => s.personId === person.id)).map(w => (
                             <div key={w.id} className="p-4 bg-[var(--surface2)] rounded-2xl cursor-pointer border border-transparent hover:border-[var(--accent)] transition-all group flex justify-between items-center"
                                onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'project', workId: w.id } })}>
                                 <div>
                                     <div className="font-bold text-sm group-hover:text-[var(--accent)] transition-colors">{w.name}</div>
                                     <div className="text-[11px] text-[var(--inkDim)] mt-0.5">{Compute.lifecycleName(state, w.lifecycleId)}</div>
                                 </div>
                                 <span className="font-mono text-[10px] font-bold uppercase bg-[var(--bg)] border border-[var(--border)] px-2 py-1 rounded text-[var(--ink)]">
                                     {w.staffing.find(s => person && s.personId === person.id)?.roleKey}
                                 </span>
                             </div>
                         ))}
                         {state.workItems.filter(w => person && w.staffing.some(s => s.personId === person.id)).length === 0 && (
                             <div className="text-sm text-[var(--inkDim)] italic p-4 text-center">No active assignments found.</div>
                         )}
                     </div>
                </div>
            </div>

            {/* RIGHT COLUMN (Details & Org) */}
            <div className="lg:col-span-4 space-y-8 flex flex-col order-1 lg:order-2">
                
                {/* PROFILE DETAILS - REDESIGNED */}
                <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] flex-1">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Award size={16} className="text-[var(--accent)]"/> Core Attributes
                        </h3>
                    </div>
                    
                    {isEditing ? (
                        <form className="space-y-6" onSubmit={handleSave} id="profile-form">
                             {/* Capacity Slider */}
                             <div className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                                <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-3 uppercase flex justify-between">
                                    <span className="flex items-center gap-1.5">Capacity Modifier <span title="Scale 1-10: 10 = Standard Full Time (100%). Lower values reduce effective capacity points."><Info size={10} /></span></span>
                                    <span className="text-[var(--accent)] font-bold">{localCapMod}/10</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="1" max="10" step="0.5" 
                                    value={localCapMod}
                                    onChange={(e) => setLocalCapMod(parseFloat(e.target.value))}
                                    className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--border)] rounded-lg appearance-none"
                                />
                                <div className="flex justify-between text-[9px] text-[var(--inkDim)] mt-2 font-mono uppercase tracking-wider">
                                    <span>Part Time</span>
                                    <span>Standard</span>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase">Availability Status</label>
                                    <select name="availability" defaultValue={person.profile.availability} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--accent)] transition-colors">
                                        {['Active','Part-time','Leave','Sick','Unavailable'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                             </div>
                            
                            {/* Skills Tag Input */}
                            <TagInput 
                                label="Skills & Competencies" 
                                value={editSkills} 
                                onChange={setEditSkills}
                                options={state.settings.profileFields.find(f => f.key === 'skills')?.options}
                            />

                            {/* Recurring Roles Tag Input */}
                            <TagInput 
                                label="Recurring Roles" 
                                value={editRoles} 
                                onChange={setEditRoles}
                                options={["Project Director", "Engagement Manager", "Quality Assurance", "Technical Lead"]}
                            />

                            <div>
                                <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase">General Notes</label>
                                <textarea name="notes" defaultValue={person.profile.notes} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-20 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--inkDim)]/50" placeholder="General profile notes..."></textarea>
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase">Transition Notes</label>
                                <textarea name="transitionNotes" defaultValue={person.profile.transitionNotes} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-20 outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--inkDim)]/50" placeholder="Notes on role changes or handover..."></textarea>
                            </div>
                            
                            {/* Manager Selection Group */}
                            <div className="pt-4 border-t border-[var(--border)] space-y-4">
                                <h4 className="text-[10px] font-mono uppercase text-[var(--inkDim)] font-bold">Reporting Lines</h4>
                                <div>
                                    <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase">Formal Manager (Line)</label>
                                    <select name="formalManager" defaultValue={person.formalManagerId || ''} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--accent)]">
                                        <option value="">-- None --</option>
                                        <option value="Board">Board</option>
                                        {state.people.filter(p => person && p.id !== person.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-[var(--inkDim)] mb-1.5 uppercase">Functional Manager (Dotted)</label>
                                    <select name="dottedManager" defaultValue={person.dottedManagerId || ''} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--accent)]">
                                        <option value="">-- None --</option>
                                        {state.people.filter(p => person && p.id !== person.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-[var(--ink)] text-[var(--bg)] rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all shadow-md mt-6">
                                <Check size={16} /> Save Changes
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Read Mode Grid */}
                            <div className="grid grid-cols-1 gap-2">
                                <InfoRow label="Availability Status" icon={Calendar} value={
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${person.profile.availability === 'Active' ? 'bg-[var(--safe)] shadow-[0_0_8px_var(--safe)]' : 'bg-[var(--warn)]'}`}></div>
                                        {person.profile.availability}
                                    </div>
                                } />
                                <InfoRow label="Capacity Factor" icon={Zap} value={
                                    <div className="flex items-center gap-2">
                                        <span>{localCapMod}/10</span>
                                        <span className="text-[10px] font-normal text-[var(--inkDim)] border border-[var(--border)] px-1.5 rounded bg-[var(--bg)]">{localCapMod === 10 ? 'Full Time' : 'Reduced'}</span>
                                    </div>
                                } />
                                
                                {/* Skills */}
                                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                    <div className="text-[10px] uppercase font-mono text-[var(--inkDim)] mb-3 flex items-center gap-2">
                                        <Hash size={12}/> Skills & Competencies
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {person.profile.skills.length > 0 ? person.profile.skills.map(s => (
                                            <span key={s} className="px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[11px] font-bold text-[var(--ink)] hover:border-[var(--accent)] transition-colors cursor-default shadow-sm">{s}</span>
                                        )) : <span className="text-xs italic text-[var(--inkDim)]">No skills listed</span>}
                                    </div>
                                </div>

                                {/* Recurring Roles */}
                                {person.profile.recurringRoles && person.profile.recurringRoles.length > 0 && (
                                    <div className="mt-4">
                                        <div className="text-[10px] uppercase font-mono text-[var(--inkDim)] mb-3 flex items-center gap-2">
                                            <Briefcase size={12}/> Recurring Roles
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {person.profile.recurringRoles.map(s => (
                                                <span key={s} className="px-3 py-1.5 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-[var(--accent)] text-[11px] font-bold shadow-sm">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {(person.profile.notes || person.profile.transitionNotes) && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
                                        {person.profile.notes && (
                                            <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)] text-xs text-[var(--ink)] leading-relaxed">
                                                <div className="text-[10px] text-[var(--inkDim)] font-bold mb-1 uppercase">Notes</div>
                                                {person.profile.notes}
                                            </div>
                                        )}
                                        {person.profile.transitionNotes && (
                                            <div className="p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)] text-xs text-[var(--ink)] leading-relaxed italic">
                                                <div className="text-[10px] text-[var(--inkDim)] font-bold mb-1 uppercase not-italic">Transition Note</div>
                                                "{person.profile.transitionNotes}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ORG LINES */}
                <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)]">
                     <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Network size={16} className="text-[var(--accent)]"/> Reporting Lines
                        </h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="relative pl-4 border-l-2 border-[var(--border)]">
                            <div className="text-[10px] uppercase text-[var(--inkDim)] mb-1">Reports To (Line)</div>
                            <div 
                                className="font-bold text-sm cursor-pointer hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                                onClick={() => person.formalManagerId && person.formalManagerId !== 'Board' && dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: person.formalManagerId }})}
                            >
                                {person.formalManagerId ? (Compute.person(state, person.formalManagerId)?.name || person.formalManagerId) : 'N/A'}
                            </div>
                        </div>

                        {person.dottedManagerId && (
                            <div className="relative pl-4 border-l-2 border-dashed border-[var(--border)]">
                                <div className="text-[10px] uppercase text-[var(--inkDim)] mb-1">Reports To (Functional)</div>
                                <div 
                                    className="font-bold text-sm cursor-pointer hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                                    onClick={() => person.dottedManagerId && dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: person.dottedManagerId }})}
                                >
                                    {Compute.person(state, person.dottedManagerId)?.name || person.dottedManagerId}
                                </div>
                            </div>
                        )}
                        
                        {(person.profile.directReports?.length || 0) > 0 && (
                            <div className="relative pl-4 border-l-2 border-[var(--border)] pt-2">
                                <div className="text-[10px] uppercase text-[var(--inkDim)] mb-3">Direct Reports ({person.profile.directReports?.length})</div>
                                <div className="flex flex-col gap-2">
                                    {person.profile.directReports!.map(rid => {
                                        const r = Compute.person(state, rid);
                                        return (
                                            <div key={rid} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface2)] hover:bg-[var(--surface)] cursor-pointer border border-transparent hover:border-[var(--border)] transition-all group"
                                                onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: rid } })}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--inkDim)] group-hover:bg-[var(--accent)] transition-colors"></div>
                                                <span className="text-xs font-bold truncate text-[var(--ink)]">{r?.name || rid}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
