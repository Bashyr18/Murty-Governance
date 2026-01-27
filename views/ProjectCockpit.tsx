
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
// Added Edit2 to imports from lucide-react
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, Users, Globe, Send, FilePlus, Download, Calendar as CalendarIcon, Clock, ArrowRight, ArrowDown, Save, X, Trash2, Calendar, Activity, AlertCircle, Info, MoreVertical, FileText, Lock, Shield, GripVertical, Check, Filter, MessageSquare, UserPlus, UserMinus, Timer, Settings, Zap, Target, HelpCircle, Edit2 } from 'lucide-react';
import { openDrawer, closeDrawer } from '../components/Drawer';
import { toast } from '../components/Toasts';
import { RaciRow, StaffingEntry, Report, Comment, RaidItem, ReportingSchedule } from '../types';
import { Avatar } from '../components/Shared';

export const ProjectCockpit: React.FC = () => {
  const { state, dispatch } = useApp();
  const { activeWorkId, currentUser } = state.ui;
  const wi = state.workItems.find(w => w.id === activeWorkId);
  const pack = activeWorkId ? state.packs[activeWorkId] : null;
  const [tab, setTab] = useState<'overview'|'raid'|'raci'|'reports'|'collab'>('overview');
  const [commentText, setCommentText] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editStaffing, setEditStaffing] = useState<StaffingEntry[]>([]);
  
  if (!wi || !pack) return <div className="p-20 text-center opacity-50"><AlertCircle size={48} className="mx-auto mb-4"/>Project not found.</div>;

  const analysis = Compute.ragAnalysis(state, wi.id);
  const ragColor = analysis.status === 'Red' ? 'var(--risk)' : analysis.status === 'Amber' ? 'var(--warn)' : 'var(--safe)';
  const userLevel = Compute.getAccessLevel(currentUser);

  const canEdit = () => userLevel <= 2 || (userLevel === 3 && wi.staffing.some(s => s.personId === currentUser));

  const handleDeleteProject = () => {
      if(window.confirm(`DANGER: Are you sure you want to permanently delete "${wi.name}"? All RAID items, RACI records, and reports will be purged. This action cannot be undone.`)) {
          dispatch({ type: 'DELETE_WORK', payload: wi.id });
          toast("Project Purged", "Initiative and governance pack removed.", "warn");
      }
  };

  const handlePostComment = () => {
      if(!commentText.trim()) return;
      dispatch({ type: 'ADD_COMMENT', payload: { workId: wi.id, text: commentText } });
      setCommentText("");
  };

  // --- RACI Responsive Logic ---
  const RaciMobileCard = ({ row, idx }: { row: RaciRow, idx: number }) => (
      <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-4 shadow-sm relative group">
          <div className="flex justify-between items-start">
              <div className="flex gap-3">
                  <span className="font-mono text-[10px] text-[var(--inkDim)] mt-1">{idx+1}.</span>
                  <div className="font-bold text-[var(--ink)] leading-tight">{row.area}</div>
              </div>
              {canEdit() && <button onClick={() => { if(window.confirm("Remove?")) { const newRaci = pack.raci.filter(r => r.id !== row.id); dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: newRaci } } }); } }} className="p-1 text-[var(--inkDim)] hover:text-[var(--risk)]"><X size={14}/></button>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--accent)] mb-1">Responsible</div>
                  <div className="text-xs font-black">{row.r || '---'}</div>
              </div>
              <div className="p-2 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--risk)] mb-1">Accountable</div>
                  <div className="text-xs font-black">{row.a || '---'}</div>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
              {row.c.length > 0 && <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--safe)]/10 text-[var(--safe)] rounded-lg text-[9px] font-bold border border-[var(--safe)]/20">C: {row.c.join(', ')}</div>}
              {row.i.length > 0 && <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--ink)]/5 text-[var(--inkDim)] rounded-lg text-[9px] font-bold border border-[var(--border)]">I: {row.i.join(', ')}</div>}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full animate-fade-in pb-10 px-4 md:px-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => dispatch({ type: 'GO_BACK' })} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition-colors shrink-0 shadow-sm"><ArrowLeft size={20} /></button>
            <div className="min-w-0">
                <h1 className="font-disp font-black text-2xl truncate tracking-tight">{wi.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase flex items-center gap-1.5 px-2 py-0.5 bg-[var(--surface2)] rounded-lg border border-[var(--border)] shrink-0" style={{color:ragColor}}>
                       <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span> {analysis.status}
                    </span>
                    <span className="text-[var(--inkDim)] text-[10px] font-mono border-l border-[var(--border)] pl-2 uppercase">{Compute.lifecycleName(state, wi.lifecycleId)}</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2 self-end sm:self-auto">
             {userLevel <= 2 && (
                 <button onClick={handleDeleteProject} className="p-3 text-[var(--inkDim)] hover:text-[var(--risk)] hover:bg-[var(--risk)]/10 rounded-xl transition-all" title="Archive / Purge Initiative">
                     <Trash2 size={18} />
                 </button>
             )}
             {canEdit() && (
                 <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2 shadow-sm ${isEditing ? 'bg-[var(--surface2)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--bg)]'}`}>
                    {isEditing ? <><X size={14}/> Close Editor</> : <><Edit2 size={14}/> Edit Initiative</>}
                 </button>
             )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] mb-8 overflow-x-auto scrollbar-hide gap-2">
          {['overview', 'raid', 'raci', 'reports', 'collab'].map(t => (
              <button key={t} onClick={() => setTab(t as any)} 
                className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${tab === t ? 'border-[var(--accent)] text-[var(--ink)]' : 'border-transparent text-[var(--inkDim)] hover:text-[var(--ink)]'}`}>
                {t === 'collab' ? 'Activity' : t === 'raci' ? 'RACI' : t === 'raid' ? 'RAID' : t === 'reports' ? 'Reports' : 'Overview'}
              </button>
          ))}
      </div>

      <div className="flex-1">
          {tab === 'overview' && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                  <div className="lg:col-span-8 space-y-8">
                      <div className="p-8 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Globe size={120}/></div>
                          <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-[var(--inkDim)] mb-4 flex items-center gap-2"><Globe size={16} className="text-[var(--accent)]"/> Context & Narrative</h3>
                          <p className="text-[var(--ink)] text-[15px] leading-[1.7] whitespace-pre-line relative z-10">{wi.description}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 pt-8 border-t border-[var(--border)]">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-[var(--inkDim)] uppercase">Primary Partners</div>
                                    <div className="flex flex-wrap gap-2">
                                        {wi.externalPartners.length > 0 ? wi.externalPartners.map(p => <span key={p} className="px-2 py-1 bg-[var(--surface2)] border border-[var(--border)] rounded text-[11px] font-medium">{p}</span>) : <span className="text-xs italic text-[var(--inkDim)]">None</span>}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-[var(--inkDim)] uppercase">Initiative Metadata</div>
                                    <div className="text-[11px] text-[var(--inkDim)] font-mono">{wi.id} • Created {new Date(wi.createdAt).toLocaleDateString()}</div>
                                </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Health Analysis Panel (Hardened UX) */}
                  <div className="lg:col-span-4 space-y-6">
                       <div className="p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-sm">
                            <h3 className="font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2"><Activity size={16} className="text-[var(--accent)]"/> Governance Analysis</h3>
                            <div className="space-y-4">
                                {analysis.reasons.length > 0 ? analysis.reasons.map((r, i) => (
                                    <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${r.impact === 'High' ? 'bg-[var(--risk)]/5 border-[var(--risk)]/20 text-[var(--risk)]' : 'bg-[var(--warn)]/5 border-[var(--warn)]/20 text-[var(--warn)]'}`}>
                                        <div className="p-2 rounded-lg bg-current/10 shrink-0"><AlertTriangle size={18}/></div>
                                        <div>
                                            <div className="text-xs font-black uppercase tracking-tight">{r.label}</div>
                                            <div className="text-[10px] opacity-70 mt-1 font-medium">{r.impact} Severity Logic Triggered</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 flex flex-col items-center justify-center text-center opacity-40">
                                        <CheckCircle size={48} className="text-[var(--safe)] mb-4"/>
                                        <div className="text-sm font-bold">Standard Operations</div>
                                        <div className="text-xs mt-1">No logic penalties detected.</div>
                                    </div>
                                )}
                            </div>
                       </div>
                  </div>
              </div>
          )}

          {tab === 'raci' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center px-2">
                      <div>
                        <h3 className="font-black text-2xl tracking-tight">Accountability Map</h3>
                        <p className="text-xs text-[var(--inkDim)] font-medium">Referential mapping of decisions to organizational roles.</p>
                      </div>
                      {canEdit() && <button onClick={() => { const n = { id: `R-${Date.now()}`, area: "New Decision Area", r: '', a: '', c: [], i: [] }; dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: [...pack.raci, n] } } }); }} className="p-3 bg-[var(--ink)] text-[var(--bg)] rounded-2xl hover:scale-105 transition-transform shadow-lg"><Plus size={18}/></button>}
                  </div>

                  {/* Mobile Stack vs Desktop Grid */}
                  <div className="md:hidden space-y-4">
                      {pack.raci.map((r, idx) => <RaciMobileCard key={r.id} row={r} idx={idx}/>)}
                  </div>

                  <div className="hidden md:block bg-[var(--card)] border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                           <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
                                <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--inkDim)]">
                                    <th className="p-6 w-[40%]">Decision Framework</th>
                                    <th className="p-6 text-center border-l border-[var(--border)] text-[var(--accent)]">R</th>
                                    <th className="p-6 text-center border-l border-[var(--border)] text-[var(--risk)]">A</th>
                                    <th className="p-6 text-center border-l border-[var(--border)] text-[var(--safe)]">C</th>
                                    <th className="p-6 text-center border-l border-[var(--border)]">I</th>
                                </tr>
                           </thead>
                           <tbody className="divide-y divide-[var(--border2)]">
                               {pack.raci.map(row => (
                                   <tr key={row.id} className="hover:bg-[var(--surface2)]/50 transition-colors">
                                       <td className="p-6 font-bold text-sm text-[var(--ink)]">{row.area}</td>
                                       <td className="p-6 text-center border-l border-[var(--border2)] font-mono text-xs font-black text-[var(--accent)]">{row.r || '-'}</td>
                                       <td className="p-6 text-center border-l border-[var(--border2)] font-mono text-xs font-black text-[var(--risk)]">{row.a || '-'}</td>
                                       <td className="p-6 text-center border-l border-[var(--border2)] font-mono text-[10px] text-[var(--safe)]">{row.c.join(', ') || '-'}</td>
                                       <td className="p-6 text-center border-l border-[var(--border2)] font-mono text-[10px] text-[var(--inkDim)]">{row.i.join(', ') || '-'}</td>
                                   </tr>
                               ))}
                           </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Activity / Comments with better UX */}
          {tab === 'collab' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 px-4">
                      <div className="p-3 rounded-2xl bg-[var(--surface2)] text-[var(--accent)]"><MessageSquare size={24}/></div>
                      <h3 className="font-black text-2xl">Project Timeline</h3>
                  </div>
                  
                  <div className="flex gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-[2rem] shadow-sm">
                      <Avatar personId={currentUser} className="w-10 h-10 border-2 border-[var(--bg)] shadow-md"/>
                      <div className="flex-1 flex gap-2">
                          <input 
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                            placeholder="Add initiative update or question..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                          />
                          <button onClick={handlePostComment} className="p-3 bg-[var(--ink)] text-[var(--bg)] rounded-2xl"><Send size={18}/></button>
                      </div>
                  </div>

                  <div className="space-y-6 pt-6">
                      {pack.comments.map(c => (
                          <div key={c.id} className="flex gap-5 px-2 group">
                              <div className="flex flex-col items-center">
                                  <Avatar personId={c.authorId} className="w-10 h-10 border-2 border-[var(--bg)] z-10"/>
                                  <div className="w-px flex-1 bg-[var(--border)] mt-2 group-last:hidden"></div>
                              </div>
                              <div className="pb-8 flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-xs">{state.people.find(p=>p.id===c.authorId)?.name || c.authorId}</span>
                                      <span className="text-[10px] font-mono text-[var(--inkDim)] uppercase">{new Date(c.createdAt).toLocaleDateString()} • {new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <p className="text-sm text-[var(--inkDim)] leading-relaxed">{c.text}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
