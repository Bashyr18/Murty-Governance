
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { ChevronRight, LayoutGrid, List as ListIcon, Filter, Layers, X, Search, ArrowUp, ArrowDown, ArrowUpDown, Calendar, Briefcase, User, ArrowRight, Group } from 'lucide-react';
import { WorkItem } from '../types';
import { Avatar } from '../components/Shared';

type SortField = 'name' | 'id' | 'phase' | 'unit' | 'status' | 'lead' | 'updated';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'lifecycle' | 'unit' | 'status';

export const ProjectCard: React.FC<{ w: WorkItem }> = ({ w }) => {
    const { state, dispatch } = useApp();
    const rag = Compute.ragForWork(state, w.id);
    const ragColor = rag === 'Red' ? 'var(--risk)' : rag === 'Amber' ? 'var(--warn)' : 'var(--safe)';
    const lead = w.staffing.find(s => ['PD','ED'].includes(s.roleKey));
    const leadPerson = lead ? state.people.find(p=>p.id===lead.personId) : null;
    
    return (
        <div 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'project', workId: w.id } })}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-0 hover:border-[var(--accent)] hover:shadow-lg transition-all cursor-pointer group flex flex-col h-[260px] relative overflow-hidden"
        >
            <div className="h-1.5 w-full" style={{ backgroundColor: ragColor }}></div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 max-w-[80%]">
                       <span className="text-[9px] font-mono font-bold text-[var(--inkDim)] uppercase border border-[var(--border)] bg-[var(--surface2)] px-1.5 py-0.5 rounded shrink-0">{w.id}</span>
                       <span className="text-[9px] font-mono font-bold text-[var(--inkDim)] uppercase border border-[var(--border)] bg-[var(--surface2)] px-1.5 py-0.5 rounded truncate">{Compute.unitName(state, w.teamUnitId)}</span>
                    </div>
                    {rag === 'Red' && <div className="animate-pulse w-2 h-2 rounded-full bg-[var(--risk)] shrink-0"></div>}
                </div>
                
                <h3 className="font-bold text-[16px] leading-tight mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">{w.name}</h3>
                <div className="text-[12px] text-[var(--inkDim)] mb-4">{Compute.lifecycleName(state, w.lifecycleId)}</div>
                
                <div className="mt-auto pt-4 border-t border-[var(--border2)] flex items-center justify-between">
                    {leadPerson ? (
                      <div className="flex items-center gap-2">
                          <Avatar personId={leadPerson.id} className="w-8 h-8" />
                          <div className="flex flex-col">
                              <span className="text-[9px] text-[var(--inkDim)] uppercase">Lead</span>
                              <span className="text-[11px] font-bold">{leadPerson.name.split(' ')[0]}</span>
                          </div>
                      </div>
                    ) : <span className="text-[11px] text-[var(--inkDim)] italic">No Lead Assigned</span>}
                    
                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] hover:bg-[var(--accent)] hover:text-white flex items-center justify-center transition-colors border border-[var(--border)]">
                        <ArrowRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectListRow: React.FC<{ w: WorkItem }> = ({ w }) => {
    const { state, dispatch } = useApp();
    const rag = Compute.ragForWork(state, w.id);
    const lead = w.staffing.find(s => ['PD','ED'].includes(s.roleKey));
    const leadPerson = lead ? state.people.find(p=>p.id===lead.personId) : null;
    
    return (
          <tr className="hover:bg-[var(--surface2)] transition-colors group cursor-pointer"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'project', workId: w.id } })}>
              <td className="p-4 font-mono text-[11px] text-[var(--inkDim)] group-hover:text-[var(--ink)]">{w.id}</td>
              <td className="p-4">
                  <div className="font-bold text-[14px] text-[var(--ink)] line-clamp-1">{w.name}</div>
                  <div className="text-[11px] text-[var(--inkDim)] truncate max-w-[200px] sm:max-w-[300px] mt-0.5">{w.description.substring(0, 60)}...</div>
              </td>
              <td className="p-4 hidden md:table-cell">
                  <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px] font-medium whitespace-nowrap text-[var(--ink)]">
                      {Compute.lifecycleName(state, w.lifecycleId)}
                  </span>
              </td>
              <td className="p-4 text-[12px] font-medium text-[var(--inkDim)] hidden sm:table-cell">{Compute.unitName(state, w.teamUnitId)}</td>
              <td className="p-4 text-center">
                  <div className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                      ${rag === 'Red' ? 'bg-[var(--risk)] text-white shadow-sm shadow-[var(--risk)]/20' : 
                        rag === 'Amber' ? 'bg-[var(--warn)] text-black shadow-sm shadow-[var(--warn)]/20' : 
                        'bg-[var(--safe)] text-white shadow-sm shadow-[var(--safe)]/20'}
                  `}>
                      {rag}
                  </div>
              </td>
              <td className="p-4 hidden lg:table-cell">
                  {leadPerson ? (
                      <div className="flex items-center gap-2">
                          <Avatar personId={leadPerson.id} className="w-6 h-6 text-[9px]" />
                          <span className="text-[12px] font-medium">{leadPerson.name.split(' ')[0]}</span>
                      </div>
                  ) : <span className="text-[var(--inkDim)] text-[11px] italic">Unassigned</span>}
              </td>
              <td className="p-4 text-right font-mono text-[11px] text-[var(--inkDim)] hidden xl:table-cell">
                  {new Date(w.updatedAt).toLocaleDateString()}
              </td>
              <td className="p-4 text-right">
                  <ChevronRight size={16} className="text-[var(--inkDim)] group-hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </td>
          </tr>
    );
};

export const Portfolio: React.FC = () => {
  const { state, dispatch } = useApp();
  const { filters } = state.ui;
  const [viewMode, setViewMode] = useState<'list'|'grid'>(window.innerWidth < 768 ? 'grid' : 'list');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilters, setShowFilters] = useState(true);
  
  const [sortConfig, setSortConfig] = useState<{key: SortField, direction: SortDirection}>({ key: 'updated', direction: 'desc' });

  const filtered = useMemo(() => {
      const term = filters.search.trim().toLowerCase();
      
      return state.workItems.filter(w => {
        if (term) {
            // 1. Text Fields (ID, Name, Description)
            const textMatch = 
                w.name.toLowerCase().includes(term) || 
                w.id.toLowerCase().includes(term) ||
                w.description.toLowerCase().includes(term);
            
            // 2. Staffing (Internal Name & External Name)
            const staffMatch = w.staffing.some(s => {
                if (s.personId) {
                    const p = state.people.find(person => person.id === s.personId);
                    return p && p.name.toLowerCase().includes(term);
                }
                return s.externalName && s.externalName.toLowerCase().includes(term);
            });

            // 3. Partners
            const partnerMatch = w.externalPartners && w.externalPartners.some(p => p.toLowerCase().includes(term));

            if (!textMatch && !staffMatch && !partnerMatch) return false;
        }
        
        if (filters.lifecycleId && w.lifecycleId !== filters.lifecycleId) return false;
        if (filters.unitId && w.teamUnitId !== filters.unitId) return false;
        if (filters.typeId && w.typeId !== filters.typeId) return false;
        return true;
      });
  }, [state.workItems, state.people, filters]);

  const sorted = useMemo(() => {
      return [...filtered].sort((a, b) => {
          let aVal: any = '';
          let bVal: any = '';

          switch(sortConfig.key) {
              case 'name': aVal = a.name; bVal = b.name; break;
              case 'id': aVal = a.id; bVal = b.id; break;
              case 'phase': aVal = Compute.lifecycleName(state, a.lifecycleId); bVal = Compute.lifecycleName(state, b.lifecycleId); break;
              case 'unit': aVal = Compute.unitName(state, a.teamUnitId); bVal = Compute.unitName(state, b.teamUnitId); break;
              case 'status': aVal = Compute.ragForWork(state, a.id); bVal = Compute.ragForWork(state, b.id); break;
              case 'updated': aVal = new Date(a.updatedAt).getTime(); bVal = new Date(b.updatedAt).getTime(); break;
              case 'lead': 
                const la = a.staffing.find(s => ['PD','ED'].includes(s.roleKey))?.personId || '';
                const lb = b.staffing.find(s => ['PD','ED'].includes(s.roleKey))?.personId || '';
                aVal = la; bVal = lb; 
                break;
          }

          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [filtered, sortConfig, state]);

  const grouped = useMemo((): Record<string, WorkItem[]> => {
      if (groupBy === 'none') return { 'All Projects': sorted };
      
      const groups: Record<string, WorkItem[]> = {};
      sorted.forEach(w => {
          let key = 'Other';
          if (groupBy === 'lifecycle') key = Compute.lifecycleName(state, w.lifecycleId);
          else if (groupBy === 'unit') key = Compute.unitName(state, w.teamUnitId);
          else if (groupBy === 'status') key = Compute.ragForWork(state, w.id);
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(w);
      });
      return groups;
  }, [sorted, groupBy, state]);

  const handleSort = (key: SortField) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const activeFilterCount = (filters.lifecycleId ? 1 : 0) + (filters.unitId ? 1 : 0) + (filters.typeId ? 1 : 0) + (filters.search ? 1 : 0);

  const clearFilters = () => {
      dispatch({ type: 'UPDATE_FILTER', payload: { lifecycleId: null, unitId: null, typeId: null, search: '' } });
  };

  const SortIcon = ({ col }: { col: SortField }) => {
      if (sortConfig.key !== col) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-[var(--accent)] ml-1" /> : <ArrowDown size={12} className="text-[var(--accent)] ml-1" />;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
                <h2 className="font-disp font-bold text-3xl tracking-tight text-[var(--ink)]">Portfolio Explorer</h2>
                <p className="text-sm text-[var(--inkDim)] mt-1 font-mono">{filtered.length} active engagements across {state.settings.taxonomy.units.length} units</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center gap-1 bg-[var(--surface2)] p-1 rounded-xl border border-[var(--border)]">
                     <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
                     >
                         <ListIcon size={18} />
                     </button>
                     <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
                     >
                         <LayoutGrid size={18} />
                     </button>
                 </div>
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wide ${showFilters || activeFilterCount > 0 ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--inkDim)] hover:bg-[var(--surface2)]'}`}
                 >
                     <Filter size={14} />
                     <span>Filters</span>
                     {activeFilterCount > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[9px]">{activeFilterCount}</span>}
                 </button>
            </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
            <div className="p-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-scale-in flex flex-col sm:flex-row flex-wrap gap-1 shadow-sm items-stretch sm:items-center">
                <div className="flex-1 min-w-[200px] relative group">
                    <Search size={14} className="absolute left-3 top-3.5 text-[var(--inkDim)] group-focus-within:text-[var(--accent)] transition-colors"/>
                    <input 
                        value={filters.search}
                        onChange={(e) => dispatch({ type: 'UPDATE_FILTER', payload: { search: e.target.value } })}
                        placeholder="Search projects, people, or partners..."
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-9 pr-3 text-sm focus:ring-0 focus:bg-[var(--surface2)] transition-colors placeholder:text-[var(--inkDim)]"
                    />
                </div>
                
                <div className="h-8 w-px bg-[var(--border)] mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2 px-3 border-r border-[var(--border2)] hidden sm:flex">
                    <Group size={14} className="text-[var(--inkDim)]" />
                    <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="bg-transparent text-xs font-bold text-[var(--ink)] outline-none cursor-pointer">
                        <option value="none" className="bg-[var(--surface)] text-[var(--ink)]">No Grouping</option>
                        <option value="lifecycle" className="bg-[var(--surface)] text-[var(--ink)]">Group by Phase</option>
                        <option value="unit" className="bg-[var(--surface)] text-[var(--ink)]">Group by Unit</option>
                        <option value="status" className="bg-[var(--surface)] text-[var(--ink)]">Group by Status</option>
                    </select>
                </div>

                <div className="flex gap-1 flex-col sm:flex-row">
                    <div className="flex-1 min-w-[150px]">
                         <select value={filters.unitId || ''} onChange={(e) => dispatch({ type: 'UPDATE_FILTER', payload: { unitId: e.target.value || null } })} className="w-full bg-[var(--surface2)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-bold uppercase text-[var(--ink)] outline-none cursor-pointer transition-all appearance-none">
                            <option value="" className="bg-[var(--surface)] text-[var(--ink)]">All Units</option>
                            {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id} className="bg-[var(--surface)] text-[var(--ink)]">{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <select value={filters.lifecycleId || ''} onChange={(e) => dispatch({ type: 'UPDATE_FILTER', payload: { lifecycleId: e.target.value || null } })} className="w-full bg-[var(--surface2)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-bold uppercase text-[var(--ink)] outline-none cursor-pointer transition-all appearance-none">
                            <option value="" className="bg-[var(--surface)] text-[var(--ink)]">All Phases</option>
                            {state.settings.taxonomy.lifecycle.map(l => <option key={l.id} value={l.id} className="bg-[var(--surface)] text-[var(--ink)]">{l.name}</option>)}
                        </select>
                    </div>
                </div>
                
                {activeFilterCount > 0 && (
                     <button onClick={clearFilters} className="px-3 py-2.5 rounded-xl hover:bg-[var(--risk)] hover:text-white text-[var(--inkDim)] transition-colors flex items-center justify-center" title="Clear All">
                         <X size={16} />
                     </button>
                )}
            </div>
        )}
      </div>

      <div className="min-h-[500px] space-y-8">
          {Object.entries(grouped).map(([groupName, items]: [string, WorkItem[]]) => (
              <div key={groupName} className="animate-fade-in">
                  {groupBy !== 'none' && (
                      <div className="flex items-center gap-3 mb-4">
                          <h3 className="font-bold text-lg text-[var(--ink)]">{groupName}</h3>
                          <span className="bg-[var(--surface2)] text-[var(--inkDim)] text-[10px] font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>
                  )}
                  {viewMode === 'list' ? (
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left text-sm border-collapse min-w-[600px] sm:min-w-[1000px]">
                                <thead className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--inkDim)] font-mono text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th onClick={() => handleSort('id')} className="p-4 w-[80px] sm:w-[100px] cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group"><div className="flex items-center">ID <SortIcon col="id"/></div></th>
                                        <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group"><div className="flex items-center">Project Name <SortIcon col="name"/></div></th>
                                        <th onClick={() => handleSort('phase')} className="p-4 w-[160px] cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group hidden md:table-cell"><div className="flex items-center">Lifecycle <SortIcon col="phase"/></div></th>
                                        <th onClick={() => handleSort('unit')} className="p-4 w-[180px] cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group hidden sm:table-cell"><div className="flex items-center">Unit <SortIcon col="unit"/></div></th>
                                        <th onClick={() => handleSort('status')} className="p-4 w-[100px] sm:w-[120px] text-center cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group"><div className="flex items-center justify-center">Status <SortIcon col="status"/></div></th>
                                        <th onClick={() => handleSort('lead')} className="p-4 w-[180px] cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group hidden lg:table-cell"><div className="flex items-center">Lead <SortIcon col="lead"/></div></th>
                                        <th onClick={() => handleSort('updated')} className="p-4 w-[120px] text-right cursor-pointer hover:bg-[var(--surface)] hover:text-[var(--accent)] transition-colors group hidden xl:table-cell"><div className="flex items-center justify-end">Updated <SortIcon col="updated"/></div></th>
                                        <th className="p-4 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border2)]">
                                    {items.map(w => <ProjectListRow key={w.id} w={w} />)}
                                </tbody>
                            </table>
                        </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                          {items.map(w => <ProjectCard key={w.id} w={w} />)}
                      </div>
                  )}
              </div>
          ))}
          {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--inkDim)]">
                  <Briefcase size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">No projects found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-[var(--surface2)] rounded-lg text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-white transition-colors">Clear All Filters</button>
              </div>
          )}
      </div>
    </div>
  );
};
