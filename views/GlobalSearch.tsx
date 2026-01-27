
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { Search, Briefcase, Users, X, Info } from 'lucide-react';
import { ProjectCard } from './Portfolio';
import { PersonCard } from './People';

export const GlobalSearch: React.FC = () => {
    const { state, dispatch } = useApp();
    const { search } = state.ui.filters;
    const term = search.trim().toLowerCase();

    const scoresById = useMemo(() => Compute.calculateAllWorkloadScores(state), [state]);

    const matchedPeople = useMemo(() => {
        if (!term) return [];
        return state.people.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.title.toLowerCase().includes(term) ||
            p.unitId.toLowerCase().includes(term) ||
            p.profile.skills?.some(s => s.toLowerCase().includes(term))
        );
    }, [state.people, term]);

    const matchedProjects = useMemo(() => {
        if (!term) return [];
        return state.workItems.filter(w => Compute.searchMatchesWork(state, w, term));
    }, [state.workItems, state.packs, term]);

    const clearSearch = () => {
        dispatch({ type: 'UPDATE_FILTER', payload: { search: '' } });
    };

    if (!term) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--inkDim)] animate-fade-in">
                <Search size={64} className="mb-6 opacity-10" />
                <h2 className="text-xl font-bold text-[var(--ink)] mb-2 uppercase tracking-tight">Intelligence Search</h2>
                <p className="text-xs max-w-sm text-center font-mono uppercase tracking-widest opacity-60">Scanning People, Portfolio, RAID & Taxonomy</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto pb-10 animate-fade-in space-y-10">
            <div className="flex items-end justify-between border-b border-[var(--border)] pb-6">
                <div>
                    <h2 className="font-disp font-black text-3xl tracking-tight text-[var(--ink)]">Cross-Entity Search</h2>
                    <p className="text-xs text-[var(--inkDim)] mt-1 font-mono uppercase tracking-wider">Results for: <span className="text-[var(--accent)] font-bold">{search}</span></p>
                </div>
                <button 
                    onClick={clearSearch}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--surface2)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase transition-colors"
                >
                    <X size={14} /> Clear
                </button>
            </div>

            <div className="space-y-12">
                <section className="animate-slide-up">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg"><Users size={20} /></div>
                        <h3 className="font-bold text-xl text-[var(--ink)]">People <span className="text-xs font-mono ml-2 opacity-40">{matchedPeople.length}</span></h3>
                    </div>
                    {matchedPeople.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {matchedPeople.map(p => (
                                <PersonCard key={p.id} p={p} score={scoresById[p.id]} fairness={Compute.checkFairnessFromScores(p.id, state, scoresById)} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 border border-dashed border-[var(--border)] rounded-3xl text-center text-[var(--inkDim)] text-xs font-mono uppercase">No Personnel Matches</div>
                    )}
                </section>

                <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[var(--safe)]/10 text-[var(--safe)] rounded-lg"><Briefcase size={20} /></div>
                        <h3 className="font-bold text-xl text-[var(--ink)]">Portfolio & RAID <span className="text-xs font-mono ml-2 opacity-40">{matchedProjects.length}</span></h3>
                    </div>
                    {matchedProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {matchedProjects.map(w => <ProjectCard key={w.id} w={w} />)}
                        </div>
                    ) : (
                        <div className="p-10 border border-dashed border-[var(--border)] rounded-3xl text-center text-[var(--inkDim)] text-xs font-mono uppercase">No Initiative Matches</div>
                    )}
                </section>
            </div>
        </div>
    );
};
