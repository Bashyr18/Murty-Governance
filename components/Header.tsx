
import React from 'react';
import { SunMoon, Printer, Search, Plus, Briefcase, FileText, MessageCircle, Building2, Target, AlignLeft, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { openDrawer, closeDrawer } from './Drawer';
import { toast } from './Toasts';

export const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { view, filters } = state.ui;

  let title = "Executive Dashboard";
  let sub = "Portfolio intelligence, workload, risk posture";

  if (view === 'portfolio') { title = "Portfolio"; sub = "Filter, drill-down, and open project cockpits"; }
  else if (view === 'people') { title = "People & Organization"; sub = "Workload, availability, assignments"; }
  else if (view === 'settings') { title = "Settings"; sub = "System configuration"; }
  else if (view === 'search') { title = "Global Search"; sub = "Results across People and Portfolio"; }
  else if (view === 'admin') { title = "Admin & Data"; sub = "Export/Import and Utilities"; }
  else if (view === 'project') {
     const w = state.workItems.find(x => x.id === state.ui.activeWorkId);
     title = w ? w.name : "Project Cockpit";
     sub = w ? w.id : "Details";
  }
  else if (view === 'person') {
     const p = state.people.find(x => x.id === state.ui.activePersonId);
     title = p ? p.name : "Person Profile";
     sub = p ? p.title : "Details";
  }

  const toggleTheme = () => {
    const next = state.ui.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: next });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_FILTER', payload: { search: e.target.value } });
    if (e.target.value && view !== 'search') {
        dispatch({ type: 'SET_VIEW', payload: { view: 'search' }});
    }
  };

  const handleQuickCreate = () => {
    openDrawer({
      title: "New Initiative",
      sub: "Launch a project, proposal, or discussion",
      saveLabel: "Initialize Work",
      content: (
        <div className="space-y-8 animate-fade-in pb-4">
            {/* Section 1: Work Type (Visual Tiles) */}
            <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <label className="block text-xs font-mono text-[var(--inkDim)] mb-3 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Sparkles size={12} className="text-[var(--accent)]"/> 1. Select Initiative Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { id: 'T-ENG', label: 'Engagement', icon: Briefcase, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', border: 'border-[var(--accent)]/20', desc: 'Active delivery project' },
                        { id: 'T-PRO', label: 'Proposal', icon: FileText, color: 'text-[var(--warn)]', bg: 'bg-[var(--warn)]/10', border: 'border-[var(--warn)]/20', desc: 'Bid or pursuit' },
                        { id: 'T-DIS', label: 'Discussion', icon: MessageCircle, color: 'text-[var(--safe)]', bg: 'bg-[var(--safe)]/10', border: 'border-[var(--safe)]/20', desc: 'Early stage conversation' }
                    ].map(type => (
                        <label key={type.id} className="cursor-pointer group relative">
                            <input type="radio" name="qc-type" value={type.id} className="peer sr-only" defaultChecked={type.id === 'T-ENG'} />
                            <div className={`
                                flex sm:flex-col items-center sm:justify-center gap-4 sm:gap-3 p-4 rounded-2xl border transition-all duration-300 h-20 sm:h-36
                                bg-[var(--surface2)] border-[var(--border)]
                                peer-checked:bg-[var(--surface)] peer-checked:border-[var(--ink)] peer-checked:shadow-xl peer-checked:scale-[1.02] peer-checked:ring-1 peer-checked:ring-[var(--ink)]
                                hover:bg-[var(--surface)] hover:border-[var(--inkDim)]
                            `}>
                                <div className={`p-3 rounded-xl transition-all duration-500 ${type.bg} ${type.color} peer-checked:scale-110 shrink-0 shadow-sm`}>
                                    <type.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col sm:items-center">
                                    <span className="text-sm font-bold uppercase tracking-wide text-[var(--inkDim)] peer-checked:text-[var(--ink)] transition-colors">{type.label}</span>
                                    <span className="text-[10px] text-[var(--inkDim)] sm:text-center opacity-70 mt-0.5">{type.desc}</span>
                                </div>
                            </div>
                            {/* Active Indicator */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:top-3 sm:translate-y-0 sm:right-3 opacity-0 peer-checked:opacity-100 transition-all duration-300 scale-50 peer-checked:scale-100">
                                <div className="w-5 h-5 bg-[var(--ink)] rounded-full flex items-center justify-center text-[var(--bg)] shadow-sm">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Section 2: Identity */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="group relative">
                    <input 
                        id="qc-name" 
                        type="text" 
                        className="peer w-full bg-transparent border-b-2 border-[var(--border)] py-2 text-xl font-bold text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-transparent" 
                        placeholder="Project Name" 
                        autoComplete="off"
                        autoFocus
                    />
                    <label className="absolute left-0 -top-3.5 text-[10px] font-mono text-[var(--accent)] uppercase transition-all 
                        peer-placeholder-shown:top-3 peer-placeholder-shown:text-lg peer-placeholder-shown:text-[var(--inkDim)] peer-placeholder-shown:font-sans 
                        peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:font-mono peer-focus:text-[var(--accent)] pointer-events-none font-bold">
                        Project Name
                    </label>
                </div>
            </div>

            {/* Section 3: Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase tracking-wider font-bold flex items-center gap-2">
                        <Building2 size={12}/> Owning Unit
                    </label>
                    <div className="relative group">
                        <select id="qc-unit" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 pl-4 pr-10 text-sm font-bold outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] appearance-none cursor-pointer hover:bg-[var(--surface)] transition-all text-[var(--ink)] shadow-sm">
                            {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-4 text-[var(--inkDim)] pointer-events-none group-hover:text-[var(--ink)] transition-colors"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase tracking-wider font-bold flex items-center gap-2">
                        <Target size={12}/> Lifecycle Phase
                    </label>
                    <div className="relative group">
                        <select id="qc-life" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 pl-4 pr-10 text-sm font-bold outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] appearance-none cursor-pointer hover:bg-[var(--surface)] transition-all text-[var(--ink)] shadow-sm">
                            {state.settings.taxonomy.lifecycle.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-4 text-[var(--inkDim)] pointer-events-none group-hover:text-[var(--ink)] transition-colors"/>
                    </div>
                </div>
            </div>

            {/* Section 4: Description */}
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase tracking-wider font-bold flex items-center gap-2">
                    <AlignLeft size={12}/> Scope & Context
                </label>
                <textarea 
                    id="qc-desc" 
                    className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 text-sm min-h-[120px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none placeholder:text-[var(--inkDim)]/40 text-[var(--ink)] shadow-inner" 
                    placeholder="Describe the objectives, deliverables, or strategic value..."
                ></textarea>
            </div>
        </div>
      ),
      onSave: () => {
         const getVal = (id: string) => {
             const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
             return el ? el.value : '';
         };

         const name = getVal('qc-name');
         const unit = getVal('qc-unit');
         const life = getVal('qc-life');
         const type = (document.querySelector('input[name="qc-type"]:checked') as HTMLInputElement)?.value || 'T-ENG';
         const desc = getVal('qc-desc');

         if(!name) {
             toast("Validation Error", "Project name is required", "error");
             return;
         }

         const newItem = {
             id: `W-${Date.now().toString().substr(-6)}`,
             name,
             teamUnitId: unit,
             lifecycleId: life,
             typeId: type,
             description: desc,
             externalPartners: [],
             staffing: [],
             complexity: 3,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
         };

         dispatch({ type: 'ADD_WORK', payload: newItem });
         toast("Project Created", `${name} added to portfolio`, "success");
         closeDrawer();
      }
    });
  };

  return (
    <header className="h-[70px] border-b border-[var(--border)] bg-[var(--surfaceGlass)] backdrop-blur-md flex items-center justify-between px-4 lg:px-7 gap-4 shrink-0 z-30 sticky top-0 transition-colors duration-500">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Brand Logo (Replaces Sidebar Toggle) */}
        <div className="lg:hidden flex items-center gap-2 pr-2 border-r border-[var(--border)] mr-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-black font-disp text-xl shadow-sm">m</div>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="font-disp font-extrabold tracking-tight text-base sm:text-lg uppercase truncate">{title}</h2>
          <div className="hidden sm:block font-mono text-[10px] text-[var(--inkDim)] truncate">{sub}</div>
          {/* Mobile Subtitle substitute */}
          <div className="sm:hidden font-mono text-[9px] text-[var(--inkDim)] truncate">Murty Governance</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="relative hidden md:block group">
             <input 
                className="w-48 lg:w-72 bg-[var(--surface2)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-4 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-inner group-hover:bg-[var(--surface)]"
                placeholder="Global Search..."
                value={filters.search}
                onChange={handleSearch}
             />
             <Search size={14} className="absolute left-3 top-2.5 text-[var(--inkDim)] group-focus-within:text-[var(--accent)] transition-colors" />
        </div>

        <button 
            onClick={handleQuickCreate}
            className="h-[36px] pl-3 pr-4 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-mono text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg group border border-[var(--ink)] hover:bg-[var(--surface)] hover:text-[var(--ink)] overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" /> 
          <span className="hidden sm:inline relative z-10">Quick Create</span>
        </button>

        <button 
            onClick={toggleTheme}
            className="h-[36px] w-[36px] flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent transition-all hover:bg-[var(--surface2)]"
            title="Toggle Theme"
        >
          <SunMoon size={18} />
        </button>
      </div>
    </header>
  );
};
