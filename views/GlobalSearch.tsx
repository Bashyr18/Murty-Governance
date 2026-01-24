
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { Search, Briefcase, Users, X } from 'lucide-react';
import { ProjectCard } from './Portfolio';
import { PersonCard } from './People';

export const GlobalSearch: React.FC = () => {
    const { state, dispatch } = useApp();
    const { search } = state.ui.filters;
    const term = search.toLowerCase();

    // Calculate Workload Scores for rendering PersonCards
    const scoresById = useMemo(() => Compute.calculateAllWorkloadScores(state), [state]);

    const matchedPeople = useMemo(() => {
        if (!term) return [];
        return state.people.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.title.toLowerCase().includes(term) ||
            p.unitId.toLowerCase().includes(term)
        );
    }, [state.people, term]);

    const matchedProjects = useMemo(() => {
        if (!term) return [];
        return state.workItems.filter(w => 
            w.name.toLowerCase().includes(term) || 
            w.id.toLowerCase().includes(term) || 
            w.description.toLowerCase().includes(term) ||
            w.externalPartners.some(p => p.toLowerCase().includes(term))
        );
    }, [state.workItems, term]);

    const clearSearch = () => {
        dispatch({ type: 'UPDATE_FILTER', payload: { search: '' } });
    };

    if (!term) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--inkDim)] animate-fade-in">
                <Search size={64} className="mb-6 opacity-10" />
                <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Global Search</h2>
                <p className="text-sm max-w-md text-center">Start typing in the top bar to search across all People, Projects, Units, and Descriptions.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto pb-10 animate-fade-in space-y-10">
            
            {/* Header */}
            <div className="flex items-end justify-between border-b border-[var(--border)] pb-6">
                <div>
                    <h2 className="font-disp font-bold text-3xl tracking-tight text-[var(--ink)]">Search Results</h2>
                    <p className="text-sm text-[var(--inkDim)] mt-1 font-mono">Found {matchedPeople.length} people and {matchedProjects.length} projects for "{search}"</p>
                </div>
                <button 
                    onClick={clearSearch}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--surface2)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase transition-colors"
                >
                    <X size={14} /> Clear Search
                </button>
            </div>

            {/* People Results */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--ink)]"><Users size={20} /></div>
                    <h3 className="font-bold text-xl text-[var(--ink)]">People</h3>
                    <span className="bg-[var(--surface2)] text-[var(--inkDim)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)]">{matchedPeople.length} Matches</span>
                </div>
                
                {matchedPeople.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {matchedPeople.map(p => (
                            <PersonCard 
                                key={p.id} 
                                p={p} 
                                score={scoresById[p.id]}
                                fairness={Compute.checkFairnessFromScores(p.id, state, scoresById)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border border-dashed border-[var(--border)] rounded-2xl text-center text-[var(--inkDim)] text-sm italic bg-[var(--surface)]/30">
                        No people found matching "{search}"
                    </div>
                )}
            </div>

            {/* Project Results */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--ink)]"><Briefcase size={20} /></div>
                    <h3 className="font-bold text-xl text-[var(--ink)]">Portfolio</h3>
                    <span className="bg-[var(--surface2)] text-[var(--inkDim)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)]">{matchedProjects.length} Matches</span>
                </div>

                {matchedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {matchedProjects.map(w => <ProjectCard key={w.id} w={w} />)}
                    </div>
                ) : (
                     <div className="p-8 border border-dashed border-[var(--border)] rounded-2xl text-center text-[var(--inkDim)] text-sm italic bg-[var(--surface)]/30">
                        No projects found matching "{search}"
                    </div>
                )}
            </div>
            
            {matchedPeople.length === 0 && matchedProjects.length === 0 && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
                     <div className="text-center opacity-30">
                         <Search size={120} className="mx-auto mb-4 text-[var(--inkDim)]"/>
                         <h2 className="text-2xl font-bold text-[var(--ink)]">No Results Found</h2>
                     </div>
                </div>
            )}
        </div>
    );
};
