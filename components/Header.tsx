
import React from 'react';
import { SunMoon, Printer, Search, Plus } from 'lucide-react';
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
      title: "Quick Create",
      sub: "Add new entity to Murty Governance",
      saveLabel: "Create Project",
      content: (
        <div className="space-y-4">
           <div>
              <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Project Name</label>
              <input id="qc-name" type="text" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm focus:border-[var(--accent)] outline-none" placeholder="e.g. Lagos Solar Initiative" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Unit</label>
                  <select id="qc-unit" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none">
                      {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id} className="bg-[var(--surface)] text-[var(--ink)]">{u.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Lifecycle</label>
                  <select id="qc-life" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none">
                      {state.settings.taxonomy.lifecycle.map(l => <option key={l.id} value={l.id} className="bg-[var(--surface)] text-[var(--ink)]">{l.name}</option>)}
                  </select>
              </div>
           </div>
           <div>
              <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Work Type</label>
              <select id="qc-type" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none">
                  {state.settings.taxonomy.workTypes.map(t => <option key={t.id} value={t.id} className="bg-[var(--surface)] text-[var(--ink)]">{t.name}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Description</label>
              <textarea id="qc-desc" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none h-24" placeholder="Brief scope..."></textarea>
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
         const type = getVal('qc-type');
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
    <header className="h-[70px] border-b border-[var(--border)] bg-[var(--surfaceGlass)] backdrop-blur-md flex items-center justify-between px-4 lg:px-7 gap-4 shrink-0 z-30 sticky top-0">
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
        <div className="relative hidden md:block">
             <input 
                className="w-48 lg:w-72 bg-[var(--surface2)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-4 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                placeholder="Global Search (People & Projects)..."
                value={filters.search}
                onChange={handleSearch}
             />
             <Search size={14} className="absolute left-3 top-2.5 text-[var(--inkDim)]" />
        </div>

        <button 
            onClick={handleQuickCreate}
            className="h-[36px] pl-3 pr-4 rounded-lg bg-[var(--ink)] text-[var(--bg)] font-mono text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-2 transition-all hover:scale-105 shadow-md"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Quick Create</span>
        </button>

        <button 
            onClick={toggleTheme}
            className="h-[36px] w-[36px] flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-transparent transition-all"
            title="Toggle Theme"
        >
          <SunMoon size={18} />
        </button>
      </div>
    </header>
  );
};
