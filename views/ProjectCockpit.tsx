
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, Users, Globe, Send, FilePlus, Download, Calendar as CalendarIcon, Clock, ArrowRight, ArrowDown, Save, X, Trash2, Calendar, Activity, AlertCircle, Info, MoreVertical, FileText, Lock, Shield, GripVertical, Check, Filter, MessageSquare, UserPlus, UserMinus, Timer, Settings, Zap, Target, HelpCircle } from 'lucide-react';
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
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: '',
      description: '',
      partners: '',
      startDate: '',
      endDate: '',
      lifecycleId: '',
      typeId: '',
      unitId: ''
  });
  const [editStaffing, setEditStaffing] = useState<StaffingEntry[]>([]);
  
  // Safe DOM accessor for Drawer forms
  const getVal = (id: string): string => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      return el ? el.value : '';
  };

  // Initialize edit state when entering edit mode
  const startEditing = () => {
      if(!wi) return;
      setEditForm({
          name: wi.name,
          description: wi.description,
          partners: (wi.externalPartners || []).join(', '),
          startDate: wi.startDate ? wi.startDate.split('T')[0] : '',
          endDate: wi.endDate ? wi.endDate.split('T')[0] : '',
          lifecycleId: wi.lifecycleId,
          typeId: wi.typeId,
          unitId: wi.teamUnitId
      });
      setEditStaffing([...wi.staffing]); 
      setIsEditing(true);
  };

  const cancelEditing = () => {
      setIsEditing(false);
  };

  if (!wi || !pack) return <div className="p-10 text-center">Project not found</div>;

  const analysis = Compute.ragAnalysis(state, wi.id);
  const ragColor = analysis.status === 'Red' ? 'var(--risk)' : analysis.status === 'Amber' ? 'var(--warn)' : 'var(--safe)';
  const userLevel = Compute.getAccessLevel(currentUser);

  // RBAC Helper
  const canEdit = () => {
      if(userLevel <= 2) return true;
      if(userLevel === 3 && wi.staffing.some(s => s.personId === currentUser)) return true;
      return false;
  };

  // --- Handlers ---
  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validation
      if (editForm.startDate && editForm.endDate && new Date(editForm.startDate) > new Date(editForm.endDate)) {
          toast("Timeline Error", "Start Date cannot be after End Date", "error");
          return;
      }

      const partners = editForm.partners.split(',').map(s=>s.trim()).filter(Boolean);
      const updatedWork = {
          ...wi,
          name: editForm.name,
          description: editForm.description,
          externalPartners: partners,
          startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
          lifecycleId: editForm.lifecycleId,
          typeId: editForm.typeId,
          teamUnitId: editForm.unitId,
          staffing: editStaffing,
          updatedAt: new Date().toISOString()
      };

      dispatch({ type: 'UPDATE_WORK', payload: updatedWork });
      toast("Project Updated", "All changes saved successfully", "success");
      setIsEditing(false);
  };

  const handlePostComment = () => {
      if(!commentText.trim()) return;
      dispatch({ type: 'ADD_COMMENT', payload: { workId: wi.id, text: commentText } });
      setCommentText("");
  };

  // Staffing Helpers
  const addStaffRow = () => {
      setEditStaffing([...editStaffing, { roleKey: 'TM', personId: null, externalName: null, allocation: 100 }]);
  };

  const removeStaffRow = (idx: number) => {
      const newS = [...editStaffing];
      newS.splice(idx, 1);
      setEditStaffing(newS);
  };

  const updateStaffRow = (idx: number, field: keyof StaffingEntry, val: any) => {
      const newS = [...editStaffing];
      if (field === 'personId') {
          // If selecting internal, clear external
          if (val) newS[idx].externalName = null;
      }
      newS[idx] = { ...newS[idx], [field]: val };
      setEditStaffing(newS);
  };

  // --- RAID Handlers ---
  const handleAddRaid = () => {
      openDrawer({
          title: "New RAID Item",
          sub: "Register a Risk, Action, Issue, or Decision",
          saveLabel: "Create Entry",
          content: (
              <div className="space-y-6">
                  
                  {/* Type Selection - Visual Tiles */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase tracking-wide font-bold">Item Type</label>
                      <div className="grid grid-cols-4 gap-2">
                          {[
                              { id: 'Risk', icon: AlertTriangle, color: 'text-[var(--risk)]' }, 
                              { id: 'Issue', icon: Zap, color: 'text-[var(--warn)]' }, 
                              { id: 'Action', icon: CheckCircle, color: 'text-[var(--safe)]' }, 
                              { id: 'Decision', icon: Target, color: 'text-[var(--accent)]' }
                          ].map(t => (
                              <label key={t.id} className="cursor-pointer group">
                                  <input type="radio" name="raid-type" value={t.id} className="peer sr-only" defaultChecked={t.id === 'Risk'} />
                                  <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)] peer-checked:bg-[var(--surface)] peer-checked:border-[var(--ink)] peer-checked:ring-1 peer-checked:ring-[var(--ink)] transition-all hover:bg-[var(--surface)]">
                                      <t.icon size={20} className={`${t.color} mb-1.5`} />
                                      <span className="text-[10px] font-bold uppercase">{t.id}</span>
                                  </div>
                              </label>
                          ))}
                      </div>
                  </div>

                  {/* Title Input - Prominent */}
                  <div className="group relative">
                      <input 
                        id="raid-title" 
                        className="w-full bg-transparent border-b-2 border-[var(--border)] py-2 text-lg font-bold text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-[var(--inkDim)]/40" 
                        placeholder="What is the item?" 
                        autoFocus
                      />
                      <label className="absolute right-0 top-2 text-[10px] font-mono text-[var(--inkDim)] uppercase opacity-0 group-focus-within:opacity-100 transition-opacity">Headline</label>
                  </div>

                  {/* Impact Selection - Color coded pills */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase tracking-wide font-bold">Severity Impact</label>
                      <div className="flex gap-2">
                          {[
                              { id: 'High', color: 'bg-[var(--risk)]', text: 'text-[var(--risk)]' },
                              { id: 'Medium', color: 'bg-[var(--warn)]', text: 'text-[var(--warn)]' },
                              { id: 'Low', color: 'bg-[var(--safe)]', text: 'text-[var(--safe)]' }
                          ].map(lvl => (
                              <label key={lvl.id} className="cursor-pointer flex-1">
                                  <input type="radio" name="raid-impact" value={lvl.id} className="peer sr-only" defaultChecked={lvl.id === 'Medium'} />
                                  <div className={`
                                      relative overflow-hidden text-center py-2.5 rounded-lg border border-[var(--border)] 
                                      text-xs font-bold uppercase transition-all
                                      peer-checked:border-transparent peer-checked:text-white
                                      hover:border-[var(--inkDim)]
                                  `}>
                                      <div className={`absolute inset-0 opacity-0 peer-checked:opacity-100 transition-opacity ${lvl.color}`}></div>
                                      <span className="relative z-10">{lvl.id}</span>
                                  </div>
                              </label>
                          ))}
                      </div>
                  </div>

                  {/* Description */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase tracking-wide font-bold">Context & Detail</label>
                      <div className="relative">
                        <textarea 
                            id="raid-desc" 
                            className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 text-sm min-h-[100px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none" 
                            placeholder="Provide background, mitigation steps, or detailed outcome..."
                        ></textarea>
                      </div>
                  </div>

                  {/* Meta Data Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Owner</label>
                          <div className="relative">
                              <select id="raid-owner" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 pl-3 text-xs font-medium outline-none focus:border-[var(--ink)] appearance-none cursor-pointer">
                                  <option value="">-- Unassigned --</option>
                                  {state.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <div className="absolute right-3 top-2.5 pointer-events-none text-[var(--inkDim)]">
                                  <ArrowDown size={14} />
                              </div>
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-[var(--inkDim)] uppercase font-bold">Due Date</label>
                          <div className="relative">
                              <input id="raid-due" type="date" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-xs font-medium outline-none focus:border-[var(--ink)] uppercase" />
                              <CalendarIcon size={14} className="absolute right-3 top-2.5 pointer-events-none text-[var(--inkDim)]" />
                          </div>
                      </div>
                  </div>
              </div>
          ),
          onSave: () => {
              // Extract values from custom inputs
              const typeEl = document.querySelector('input[name="raid-type"]:checked') as HTMLInputElement;
              const type = typeEl ? typeEl.value : 'Risk';
              
              const impactEl = document.querySelector('input[name="raid-impact"]:checked') as HTMLInputElement;
              const impact = impactEl ? impactEl.value : 'Medium';

              const title = getVal('raid-title');
              const description = getVal('raid-desc');
              const ownerId = getVal('raid-owner') || null;
              const due = getVal('raid-due') || null;

              if(!title) {
                  toast("Validation Error", "Please provide a title for this item", "error");
                  return;
              }

              const newItem: RaidItem = {
                  id: `RI-${Date.now().toString().substr(-6)}`,
                  type, 
                  impact, 
                  title, 
                  description, 
                  ownerId, 
                  due: due ? new Date(due).toISOString() : null,
                  status: 'Open', 
                  probability: 'Medium', 
                  createdAt: new Date().toISOString(), 
                  updatedAt: new Date().toISOString()
              };

              dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raid: [newItem, ...(pack.raid || [])] } } });
              toast("Item Created", `${type} added to register`, "success");
              closeDrawer();
          }
      });
  };

  const handleEditRaid = (item: RaidItem) => {
      openDrawer({
          title: `Edit ${item.type}`,
          sub: item.id,
          saveLabel: "Update Item",
          content: (
              <div className="space-y-6">
                   <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">Status</label>
                      <div className="flex p-1 bg-[var(--surface2)] rounded-lg border border-[var(--border)]">
                          {state.settings.taxonomy.raid.status.map(s => (
                              <label key={s} className="flex-1 cursor-pointer">
                                  <input type="radio" name="raid-status" value={s} className="peer sr-only" defaultChecked={item.status === s} />
                                  <div className="text-center py-2 text-[10px] font-bold uppercase rounded-md text-[var(--inkDim)] peer-checked:bg-[var(--surface)] peer-checked:text-[var(--ink)] peer-checked:shadow-sm transition-all hover:text-[var(--ink)]">
                                      {s}
                                  </div>
                              </label>
                          ))}
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">Impact Level</label>
                      <div className="flex gap-2">
                          {state.settings.taxonomy.raid.impact.map(lvl => (
                              <label key={lvl} className="cursor-pointer flex-1">
                                  <input type="radio" name="raid-impact" value={lvl} className="peer sr-only" defaultChecked={item.impact === lvl} />
                                  <div className={`
                                      text-center py-2 rounded-lg border border-[var(--border)] 
                                      text-xs font-bold uppercase transition-all
                                      peer-checked:border-[var(--accent)] peer-checked:text-[var(--accent)] peer-checked:bg-[var(--accent)]/5
                                      hover:bg-[var(--surface2)]
                                  `}>
                                      {lvl}
                                  </div>
                              </label>
                          ))}
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase font-bold">Description</label>
                      <textarea id="raid-desc" defaultValue={item.description} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-32 outline-none focus:border-[var(--accent)] resize-none"></textarea>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1.5 uppercase font-bold">Owner</label>
                          <select id="raid-owner" defaultValue={item.ownerId || ''} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-xs font-medium outline-none focus:border-[var(--ink)]">
                              <option value="">-- Unassigned --</option>
                              {state.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1.5 uppercase font-bold">Due Date</label>
                          <input id="raid-due" type="date" defaultValue={item.due ? item.due.split('T')[0] : ''} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-xs font-medium outline-none focus:border-[var(--ink)]" />
                      </div>
                   </div>

                   <div className="pt-6 mt-2 border-t border-[var(--border)] flex justify-between items-center">
                       <button onClick={() => {
                           if(window.confirm("Delete this item?")) {
                               const newRaid = pack.raid.filter(r => r.id !== item.id);
                               dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raid: newRaid } } });
                               toast("Deleted", "Item removed from register", "info");
                               closeDrawer();
                           }
                       }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--risk)]/10 text-[var(--risk)] text-xs font-bold uppercase transition-colors">
                           <Trash2 size={14}/> Delete
                       </button>
                   </div>
              </div>
          ),
          onSave: () => {
              const statusEl = document.querySelector('input[name="raid-status"]:checked') as HTMLInputElement;
              const status = statusEl ? statusEl.value : item.status;

              const impactEl = document.querySelector('input[name="raid-impact"]:checked') as HTMLInputElement;
              const impact = impactEl ? impactEl.value : item.impact;

              const description = getVal('raid-desc');
              const ownerId = getVal('raid-owner') || null;
              const dueStr = getVal('raid-due');
              
              const updatedItem: RaidItem = {
                  ...item,
                  status,
                  impact,
                  description,
                  ownerId,
                  due: dueStr ? new Date(dueStr).toISOString() : null,
                  updatedAt: new Date().toISOString()
              };

              const newRaid = pack.raid.map(r => r.id === item.id ? updatedItem : r);
              dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raid: newRaid } } });
              toast("Updated", "RAID item updated", "success");
              closeDrawer();
          }
      })
  };

  const handleNewReport = () => {
      openDrawer({
          title: "New Status Report",
          sub: `Weekly update for ${wi.name}`,
          saveLabel: "Publish Report",
          content: (
              <div className="space-y-6">
                  {/* RAG Selector */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-3 uppercase">Health Status (RAG)</label>
                      <div className="grid grid-cols-3 gap-3">
                          {['Green', 'Amber', 'Red'].map((status) => (
                              <label key={status} className="cursor-pointer group relative">
                                  <input type="radio" name="rag" value={status} className="peer sr-only" defaultChecked={status === 'Green'} />
                                  <div className={`p-3 rounded-xl border border-[var(--border)] text-center transition-all peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-[var(--bg)]
                                      ${status === 'Green' ? 'peer-checked:bg-[var(--safe)] peer-checked:border-[var(--safe)] peer-checked:text-white' : 
                                        status === 'Amber' ? 'peer-checked:bg-[var(--warn)] peer-checked:border-[var(--warn)] peer-checked:text-black' : 
                                        'peer-checked:bg-[var(--risk)] peer-checked:border-[var(--risk)] peer-checked:text-white'
                                      } hover:bg-[var(--surface2)]`}>
                                      <div className="font-bold text-sm">{status}</div>
                                  </div>
                              </label>
                          ))}
                      </div>
                  </div>

                  {/* Summary */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase">Executive Summary</label>
                      <textarea id="rep-summary" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-24 focus:border-[var(--accent)] outline-none" placeholder="High-level progress summary for stakeholders..."></textarea>
                  </div>

                  {/* Achievements */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase">Key Achievements (One per line)</label>
                      <textarea id="rep-achieve" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-24 focus:border-[var(--accent)] outline-none font-mono text-xs" placeholder="- Completed Phase 1 design..."></textarea>
                  </div>

                  {/* Next Steps */}
                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-2 uppercase">Next Steps (One per line)</label>
                      <textarea id="rep-next" className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-sm h-24 focus:border-[var(--accent)] outline-none font-mono text-xs" placeholder="- Initiate stakeholder interviews..."></textarea>
                  </div>
              </div>
          ),
          onSave: () => {
              const rag = (document.querySelector('input[name="rag"]:checked') as HTMLInputElement)?.value as any;
              const summary = getVal('rep-summary');
              const achieveRaw = getVal('rep-achieve');
              const nextRaw = getVal('rep-next');

              if(!summary) {
                  toast("Validation Error", "Summary is required", "error");
                  return;
              }

              const newReport: Report = {
                  id: `R-${Date.now()}`,
                  ts: new Date().toISOString(),
                  rag,
                  summary,
                  achievements: achieveRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-'),
                  nextSteps: nextRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0 && s !== '-'),
                  asks: [],
                  blockers: [],
                  by: state.people.find(p => p.id === currentUser)?.name || currentUser
              };

              const newPack = { ...pack, reports: [newReport, ...(pack.reports || [])] };
              dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: newPack } });
              toast("Report Published", "Status update recorded successfully", "success");
              closeDrawer();
          }
      });
  };

  const handleScheduleReport = () => {
      // Default Values
      const current = pack.reportingSchedule || {
          cadence: 'None',
          dayOfWeek: 'Friday',
          timeOfDay: '09:00',
          format: 'PDF',
          recipients: []
      };

      // Helper to calculate preview
      const calculateNextRun = (cadence: string, day: string, time: string) => {
          if(cadence === 'None') return "Automation disabled";
          
          const daysMap: Record<string, number> = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0 };
          const targetDay = daysMap[day] ?? 5;
          const [hours, mins] = time.split(':').map(Number);
          
          const now = new Date();
          let next = new Date();
          next.setHours(hours, mins, 0, 0);
          
          // Calculate next occurrence of the day
          const currentDay = now.getDay();
          let daysUntil = (targetDay + 7 - currentDay) % 7;
          
          // If today is the day but time has passed, add 7 days (for weekly)
          if (daysUntil === 0 && now > next) {
              daysUntil = 7;
          }
          
          next.setDate(now.getDate() + daysUntil);
          
          if(cadence === 'Monthly') {
              while(next.getMonth() === now.getMonth()) {
                  next.setDate(next.getDate() + 7);
              }
          }

          return `Next generation: ${next.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})} at ${time}`;
      };

      openDrawer({
          title: "Automated Reporting",
          sub: "Configure schedule and recipients",
          saveLabel: "Save Schedule",
          content: (
              <div className="space-y-6">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                      <div>
                          <div className="font-bold text-sm text-[var(--ink)]">Enable Automation</div>
                          <div className="text-[10px] text-[var(--inkDim)]">Generate draft reports automatically</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" id="sched-enable" className="sr-only peer" defaultChecked={current.cadence !== 'None'} />
                          <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                      </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Frequency</label>
                          <select id="sched-cadence" defaultValue={current.cadence === 'None' ? 'Weekly' : current.cadence} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none">
                              <option>Weekly</option>
                              <option>Bi-Weekly</option>
                              <option>Monthly</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Format</label>
                          <select id="sched-format" defaultValue={current.format} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none">
                              <option>PDF</option>
                              <option>CSV</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Day of Week</label>
                          <select id="sched-day" defaultValue={current.dayOfWeek || 'Friday'} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Time</label>
                          <input type="time" id="sched-time" defaultValue={current.timeOfDay || '09:00'} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none" />
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Recipients (Comma separated emails)</label>
                      <input id="sched-recipients" defaultValue={current.recipients.join(', ')} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-2.5 text-sm outline-none" placeholder="stakeholder@company.com, pmo@company.com" />
                  </div>

                  {/* Preview Box - Could be reactive but simple static text for now in this imperative drawer pattern */}
                  <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl flex items-center gap-3">
                      <Clock size={16} className="text-[var(--accent)]"/>
                      <div className="text-xs text-[var(--ink)] font-medium">
                          Note: Automation will run based on server time (UTC).
                      </div>
                  </div>
              </div>
          ),
          onSave: () => {
              const enabledEl = document.getElementById('sched-enable') as HTMLInputElement;
              const enabled = enabledEl ? enabledEl.checked : false;
              const cadence = enabled ? getVal('sched-cadence') : 'None';
              const format = getVal('sched-format') as any;
              const dayOfWeek = getVal('sched-day');
              const timeOfDay = getVal('sched-time');
              const recipients = getVal('sched-recipients').split(',').map(s=>s.trim()).filter(Boolean);

              const newSchedule: ReportingSchedule = {
                  cadence: cadence as any,
                  dayOfWeek,
                  timeOfDay,
                  format,
                  recipients
              };

              const newPack = { ...pack, reportingSchedule: newSchedule };
              dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: newPack } });
              
              if(enabled) {
                  toast("Automation Configured", calculateNextRun(cadence, dayOfWeek, timeOfDay), "success");
              } else {
                  toast("Automation Disabled", "Schedule cleared", "info");
              }
              closeDrawer();
          }
      });
  };

  // --- RACI Logic ---
  const raciRows = pack.raci || [];
  
  useEffect(() => {
      if (pack && (!pack.raci || pack.raci.length === 0)) {
          const defaults = state.settings.templates.raciDecisionAreas.map(area => ({ 
              id: `R-${Math.random().toString(36).substr(2,9)}`, 
              area, 
              r: '', a: '', c: [], i: [] 
          } as RaciRow));
          dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: defaults } } });
      }
  }, [wi.id, pack?.raci, state.settings.templates.raciDecisionAreas]);

  const handleRaciChange = (rowId: string, field: keyof RaciRow, value: any) => {
      const newRaci = raciRows.map(r => {
          if (r.id === rowId) return { ...r, [field]: value };
          return r;
      });
      dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: newRaci } } });
  };

  const addRaciRow = () => {
      const newRow: RaciRow = { 
          id: `R-${Math.random().toString(36).substr(2,9)}`, 
          area: "New Decision Area", 
          r: '', a: '', c: [], i: [] 
      };
      dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: [...raciRows, newRow] } } });
  };

  const deleteRaciRow = (rowId: string) => {
       if(window.confirm("Remove this row?")) {
          const newRaci = raciRows.filter(r => r.id !== rowId);
          dispatch({ type: 'UPDATE_PACK', payload: { workId: wi.id, pack: { raci: newRaci } } });
       }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex items-start sm:items-center gap-4 mb-6">
        <button onClick={() => dispatch({ type: 'GO_BACK' })} 
           className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] transition-colors shrink-0">
            <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
                <h1 className="font-disp font-black text-xl sm:text-2xl truncate">{wi.name}</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] uppercase text-[var(--inkDim)] shrink-0">{wi.id}</span>
            </div>
            <div className="text-[var(--inkDim)] text-xs flex flex-wrap items-center gap-2 mt-1">
                <span className="truncate">{Compute.lifecycleName(state, wi.lifecycleId)}</span> • <span className="truncate">{Compute.typeName(state, wi.typeId)}</span> • 
                <span style={{color:ragColor}} className="font-bold flex items-center gap-1 px-2 py-0.5 bg-[var(--surface2)] rounded border border-[var(--border)] shrink-0">
                   <span className="w-2 h-2 rounded-full bg-current"></span> {analysis.status}
                </span>
            </div>
        </div>
        {tab === 'overview' && (
            canEdit() ? (
                <button onClick={() => isEditing ? cancelEditing() : startEditing()} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors flex items-center gap-2 shrink-0 ${isEditing ? 'bg-[var(--surface2)] border border-[var(--border)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--bg)] hover:opacity-90'}`}>
                    {isEditing ? <><X size={14}/> <span className="hidden sm:inline">Cancel</span></> : <><CheckCircle size={14}/> <span className="hidden sm:inline">Edit Project</span><span className="sm:hidden">Edit</span></>}
                </button>
            ) : null
        )}
      </div>

      <div className="flex border-b border-[var(--border)] mb-6 overflow-x-auto scrollbar-hide">
          {['overview', 'raid', 'raci', 'reports', 'collab'].map(t => (
              <button key={t} onClick={() => setTab(t as any)} 
                className={`px-4 sm:px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-[var(--accent)] text-[var(--ink)]' : 'border-transparent text-[var(--inkDim)] hover:text-[var(--ink)]'}`}>
                {t === 'collab' ? 'Discussion' : t === 'raci' ? 'RACI Matrix' : t === 'raid' ? 'RAID Log' : t === 'reports' ? 'Reports' : 'Overview'}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-auto">
          {tab === 'overview' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                  <div className="lg:col-span-2 space-y-6">
                      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                          <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-[var(--accent)]"/> Scope & Definition</h3>
                          {isEditing ? (
                              <form onSubmit={handleUpdate} className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Project Name</label>
                                      <input 
                                        type="text" 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                        className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm focus:border-[var(--accent)] outline-none"
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Lifecycle Phase</label>
                                          <select value={editForm.lifecycleId} onChange={e => setEditForm({...editForm, lifecycleId: e.target.value})} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none">
                                              {state.settings.taxonomy.lifecycle.map(l => <option key={l.id} value={l.id} className="bg-[var(--surface)] text-[var(--ink)]">{l.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Unit</label>
                                          <select value={editForm.unitId} onChange={e => setEditForm({...editForm, unitId: e.target.value})} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none">
                                              {state.settings.taxonomy.units.map(u => <option key={u.id} value={u.id} className="bg-[var(--surface)] text-[var(--ink)]">{u.name}</option>)}
                                          </select>
                                      </div>
                                  </div>
                                  <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm h-32 leading-relaxed focus:border-[var(--accent)] outline-none" placeholder="Description" />
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">Start Date</label>
                                          <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none"/>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-mono text-[var(--inkDim)] mb-1 uppercase">End Date</label>
                                          <input type="date" value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-3 text-sm outline-none"/>
                                      </div>
                                  </div>

                                   <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                                      <button type="button" onClick={cancelEditing} className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--ink)] font-bold text-sm uppercase hover:bg-[var(--surface2)]">Cancel</button>
                                      <button type="submit" className="px-6 py-3 rounded-xl bg-[var(--ink)] text-[var(--bg)] font-bold text-sm uppercase hover:opacity-90 flex items-center gap-2">
                                          <Save size={16} /> Save Project
                                      </button>
                                  </div>
                              </form>
                          ) : (
                            <p className="text-[var(--ink)] text-sm leading-relaxed whitespace-pre-line">{wi.description}</p>
                          )}
                      </div>
                       
                       {/* Staffing Section */}
                       <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold flex items-center gap-2"><Users size={16} className="text-[var(--accent)]"/> Staffing</h3>
                              {isEditing && (
                                  <button onClick={addStaffRow} className="text-xs font-bold uppercase text-[var(--accent)] flex items-center gap-1 hover:underline">
                                      <UserPlus size={14} /> Add Member
                                  </button>
                              )}
                          </div>
                          
                          {isEditing ? (
                              <div className="space-y-3">
                                  {editStaffing.map((s, idx) => (
                                      <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-[var(--surface2)] p-2 rounded-xl">
                                          <select 
                                            value={s.roleKey} 
                                            onChange={(e) => updateStaffRow(idx, 'roleKey', e.target.value)} 
                                            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs font-bold outline-none w-full sm:w-[120px]"
                                          >
                                              {state.settings.taxonomy.roleKeys.map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
                                          </select>
                                          
                                          <select 
                                            value={s.personId || ''} 
                                            onChange={(e) => updateStaffRow(idx, 'personId', e.target.value || null)} 
                                            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs outline-none flex-1"
                                          >
                                              <option value="">-- External / TBD --</option>
                                              {state.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>

                                          {!s.personId && (
                                              <input 
                                                placeholder="Ext. Name" 
                                                value={s.externalName || ''} 
                                                onChange={(e) => updateStaffRow(idx, 'externalName', e.target.value)}
                                                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs outline-none flex-1"
                                              />
                                          )}

                                          <div className="flex items-center gap-2">
                                              <input 
                                                type="number" 
                                                min="0" max="100" 
                                                value={s.allocation || 100} 
                                                onChange={(e) => updateStaffRow(idx, 'allocation', parseInt(e.target.value))}
                                                className="w-16 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-center outline-none"
                                                title="Allocation %"
                                              />
                                              <button onClick={() => removeStaffRow(idx)} className="p-2 text-[var(--risk)] hover:bg-[var(--risk)] hover:text-white rounded-lg transition-colors">
                                                  <UserMinus size={14} />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  {editStaffing.length === 0 && <div className="text-center text-xs text-[var(--inkDim)] italic py-2">No staff assigned. Add a member above.</div>}
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {wi.staffing.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[var(--surface2)] border border-transparent hover:border-[var(--border)] transition-all">
                                            <div className="flex items-center gap-3">
                                                <Avatar personId={s.personId} name={s.externalName || 'Ext'} className="w-8 h-8"/>
                                                <div>
                                                    <div className="text-[10px] font-mono text-[var(--inkDim)] uppercase mb-0.5">
                                                        {state.settings.taxonomy.roleKeys.find(r => r.key === s.roleKey)?.name || s.roleKey}
                                                    </div>
                                                    <div className="font-bold text-sm cursor-pointer hover:text-[var(--accent)]" 
                                                    onClick={() => s.personId && dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: s.personId }})}>
                                                        {Compute.staffLabel(state, s)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono font-bold bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border)]">
                                                {s.allocation || 100}%
                                            </div>
                                        </div>
                                    ))}
                              </div>
                          )}
                       </div>
                  </div>
                  
                  {/* Right Column Metrics */}
                  <div className="space-y-6">
                      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                           <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={16} className="text-[var(--accent)]"/> Project Health</h3>
                           <div className="space-y-4">
                               {analysis.reasons.length > 0 ? analysis.reasons.map((r, i) => (
                                   <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border2)]">
                                       {r.impact === 'High' ? <AlertTriangle size={16} className="text-[var(--risk)] shrink-0 mt-0.5"/> : <Info size={16} className="text-[var(--warn)] shrink-0 mt-0.5"/>}
                                       <div>
                                           <div className="text-xs font-bold text-[var(--ink)]">{r.label}</div>
                                           <div className="text-[10px] text-[var(--inkDim)] uppercase mt-0.5">{r.type} • {r.impact} Impact</div>
                                       </div>
                                   </div>
                               )) : (
                                   <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border2)]">
                                       <CheckCircle size={16} className="text-[var(--safe)]"/>
                                       <div className="text-xs font-bold text-[var(--ink)]">All Systems Nominal</div>
                                   </div>
                               )}
                           </div>
                      </div>
                      
                      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                           <h3 className="font-bold mb-4 flex items-center gap-2"><CalendarIcon size={16} className="text-[var(--accent)]"/> Timeline</h3>
                           <div className="space-y-3 text-sm">
                               <div className="flex justify-between">
                                   <span className="text-[var(--inkDim)]">Start Date</span>
                                   <span className="font-mono">{wi.startDate ? new Date(wi.startDate).toLocaleDateString() : 'TBD'}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="text-[var(--inkDim)]">End Date</span>
                                   <span className="font-mono">{wi.endDate ? new Date(wi.endDate).toLocaleDateString() : 'TBD'}</span>
                               </div>
                               <div className="w-full bg-[var(--surface2)] h-1.5 rounded-full mt-2 overflow-hidden">
                                   <div className="bg-[var(--accent)] h-full w-[35%]"></div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          )}

          {/* RAID TAB */}
          {tab === 'raid' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                       <div>
                           <h3 className="font-bold text-lg">RAID Register</h3>
                           <p className="text-xs text-[var(--inkDim)]">Risks, Actions, Issues, Decisions</p>
                       </div>
                       {canEdit() && (
                         <button onClick={handleAddRaid} className="flex items-center gap-2 px-4 py-2 bg-[var(--surface2)] hover:bg-[var(--surface)] transition-colors rounded-xl text-xs font-bold border border-[var(--border)] uppercase">
                            <Plus size={14}/> Add Item
                         </button>
                       )}
                  </div>
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm min-w-[700px]">
                              <thead className="bg-[var(--surface2)] text-[var(--inkDim)] text-[10px] uppercase font-mono tracking-wider">
                                  <tr>
                                      <th className="p-4 w-[100px]">Type</th>
                                      <th className="p-4">Description</th>
                                      <th className="p-4 w-[120px]">Impact</th>
                                      <th className="p-4 w-[120px]">Owner</th>
                                      <th className="p-4 w-[120px]">Status</th>
                                      <th className="p-4 w-[120px]">Due</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border2)]">
                                  {pack.raid.map(r => (
                                      <tr key={r.id} onClick={() => canEdit() && handleEditRaid(r)} className={`transition-colors group ${canEdit() ? 'cursor-pointer hover:bg-[var(--surface2)]' : ''}`}>
                                          <td className="p-4">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                                ${r.type==='Risk'?'bg-[var(--risk)]/10 text-[var(--risk)] border-[var(--risk)]/20': 
                                                  r.type==='Issue'?'bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/20': 
                                                  r.type==='Decision'?'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20':
                                                  'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)]'}`}>
                                                  {r.type}
                                              </span>
                                          </td>
                                          <td className="p-4 font-medium text-[var(--ink)]">
                                            <div className="font-bold">{r.title}</div>
                                            <div className="text-xs text-[var(--inkDim)] line-clamp-1">{r.description}</div>
                                          </td>
                                          <td className="p-4">
                                              <span className={`${r.impact==='High'?'text-[var(--risk)]':r.impact==='Medium'?'text-[var(--warn)]':'text-[var(--safe)]'} font-bold text-xs flex items-center gap-1`}>
                                                  {r.impact==='High' && <AlertCircle size={12}/>}
                                                  {r.impact}
                                              </span>
                                          </td>
                                          <td className="p-4">
                                              <div className="flex items-center gap-2">
                                                  <Avatar personId={r.ownerId} className="w-6 h-6 text-[9px]"/>
                                              </div>
                                          </td>
                                          <td className="p-4 text-xs font-mono">{r.status}</td>
                                          <td className="p-4 font-mono text-xs text-[var(--inkDim)]">{r.due?.split('T')[0] || '-'}</td>
                                      </tr>
                                  ))}
                                  {pack.raid.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-[var(--inkDim)] italic bg-[var(--surface)]">No items recorded in register.</td></tr>}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* REPORTS TAB */}
          {tab === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                       <div>
                           <h3 className="font-bold text-lg">Status Reports</h3>
                           <p className="text-xs text-[var(--inkDim)]">Weekly progress and health checks</p>
                       </div>
                       {canEdit() && (
                           <div className="flex gap-2">
                               <button onClick={handleScheduleReport} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] hover:bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase transition-all">
                                   <Settings size={14} /> <span className="hidden sm:inline">Automate</span>
                               </button>
                               <button onClick={handleNewReport} className="flex items-center gap-2 px-4 py-2 bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 rounded-xl text-xs font-bold uppercase shadow-lg transition-transform hover:scale-105 active:scale-95">
                                  <FilePlus size={14}/> New Report
                               </button>
                           </div>
                       )}
                  </div>
                  
                  {/* Active Schedule Banner */}
                  {pack.reportingSchedule && pack.reportingSchedule.cadence !== 'None' && (
                      <div className="p-3 bg-[var(--surface2)] border border-[var(--accent)]/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]"><Timer size={16}/></div>
                              <div>
                                  <div className="text-xs font-bold text-[var(--ink)]">Automation Active</div>
                                  <div className="text-[10px] text-[var(--inkDim)]">
                                      {pack.reportingSchedule.cadence} on {pack.reportingSchedule.dayOfWeek}s at {pack.reportingSchedule.timeOfDay}
                                  </div>
                              </div>
                          </div>
                          <button onClick={handleScheduleReport} className="text-[10px] font-bold uppercase text-[var(--accent)] hover:underline">Edit</button>
                      </div>
                  )}

                  <div className="grid gap-4">
                      {pack.reports.map(r => (
                          <div key={r.id} className="p-6 border border-[var(--border)] bg-[var(--card)] rounded-2xl hover:border-[var(--accent)] transition-all shadow-sm group">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-4">
                                  <div className="flex items-center gap-4">
                                      <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-2
                                          ${r.rag==='Green'?'bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20': 
                                            r.rag==='Red'?'bg-[var(--risk)]/10 text-[var(--risk)] border-[var(--risk)]/20':
                                            'bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/20'}`}>
                                          <div className={`w-2 h-2 rounded-full ${r.rag==='Green'?'bg-[var(--safe)]':r.rag==='Red'?'bg-[var(--risk)]':'bg-[var(--warn)]'}`}></div>
                                          {r.rag} Status
                                      </div>
                                      <span className="text-xs text-[var(--inkDim)] font-mono flex items-center gap-1">
                                          <Calendar size={12}/> {new Date(r.ts).toLocaleDateString()}
                                      </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[var(--inkDim)]">
                                      <span>Filed by</span>
                                      <Avatar name={r.by || 'Unknown'} className="w-6 h-6 text-[8px]"/>
                                  </div>
                              </div>
                              <p className="text-sm leading-relaxed mb-6 p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border2)]">{r.summary}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <h4 className="text-[10px] uppercase font-bold text-[var(--inkDim)] mb-2 flex items-center gap-1"><Check size={12}/> Key Achievements</h4>
                                      <ul className="list-disc list-inside text-xs space-y-1 text-[var(--ink)] ml-1">
                                          {r.achievements.map((x,i) => <li key={i}>{x}</li>)}
                                      </ul>
                                  </div>
                                  <div>
                                      <h4 className="text-[10px] uppercase font-bold text-[var(--inkDim)] mb-2 flex items-center gap-1"><ArrowRight size={12}/> Next Steps</h4>
                                      <ul className="list-disc list-inside text-xs space-y-1 text-[var(--ink)] ml-1">
                                          {r.nextSteps.map((x,i) => <li key={i}>{x}</li>)}
                                      </ul>
                                  </div>
                              </div>
                          </div>
                      ))}
                       {pack.reports.length === 0 && (
                           <div className="p-16 border border-dashed border-[var(--border)] rounded-2xl text-center flex flex-col items-center justify-center bg-[var(--surface)]">
                               <FileText size={48} className="text-[var(--inkDim)] opacity-20 mb-4"/>
                               <p className="text-[var(--inkDim)] font-medium">No reports filed yet.</p>
                               <p className="text-xs text-[var(--inkDim)] opacity-60 mt-1">Create the first status report to track progress.</p>
                           </div>
                       )}
                  </div>
              </div>
          )}

          {/* COLLAB TAB */}
          {tab === 'collab' && (
              <div className="flex flex-col h-[600px] border border-[var(--border)] rounded-2xl bg-[var(--card)] overflow-hidden animate-fade-in shadow-sm">
                  <div className="p-4 border-b border-[var(--border)] bg-[var(--surface2)] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-[var(--accent)]"/>
                          <span className="font-bold text-sm">Project Discussion</span>
                      </div>
                      <span className="text-[10px] text-[var(--inkDim)] uppercase font-mono">{pack.comments.length} Messages</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col-reverse bg-[var(--surface)]">
                      {pack.comments.map(c => {
                           const author = state.people.find(p => p.id === c.authorId);
                           const isMe = c.authorId === currentUser;
                           return (
                               <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-slide-up`}>
                                   <Avatar personId={c.authorId} className="w-8 h-8 shrink-0"/>
                                   <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-[var(--ink)] text-[var(--bg)] rounded-tr-none' : 'bg-[var(--card)] border border-[var(--border)] text-[var(--ink)] rounded-tl-none'}`}>
                                       <div className={`font-bold text-[10px] mb-1 opacity-70 flex justify-between gap-4 ${isMe ? 'text-[var(--bg)]' : 'text-[var(--inkDim)]'}`}>
                                           <span>{author?.name || c.authorId}</span>
                                           <span>{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                       </div>
                                       {c.text}
                                   </div>
                               </div>
                           )
                      })}
                       {pack.comments.length === 0 && (
                           <div className="m-auto flex flex-col items-center justify-center opacity-50">
                               <MessageSquare size={48} className="mb-2"/>
                               <div className="text-sm italic">No comments yet. Start the conversation.</div>
                           </div>
                       )}
                  </div>
                  <div className="p-4 bg-[var(--surface2)] border-t border-[var(--border)] flex gap-2">
                      <input 
                          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-all shadow-inner"
                          placeholder="Type a message..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                      />
                      <button onClick={handlePostComment} className="p-3 bg-[var(--ink)] text-[var(--bg)] rounded-xl hover:opacity-90 hover:scale-105 transition-all shadow-md">
                          <Send size={18}/>
                      </button>
                  </div>
              </div>
          )}

          {/* RACI TAB */}
          {tab === 'raci' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-xl">Decision Matrix (RACI)</h3>
                        <p className="text-sm text-[var(--inkDim)]">Define accountability for key governance areas.</p>
                      </div>
                      {canEdit() && (
                          <button onClick={addRaciRow} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)] font-bold text-xs uppercase hover:border-[var(--accent)] transition-all shadow-sm">
                              <Plus size={14} /> Add Decision Area
                          </button>
                      )}
                  </div>

                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm ring-1 ring-[var(--border)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px] border-collapse min-w-[900px]">
                            <thead className="bg-[var(--surface2)] border-b border-[var(--border)] text-[var(--inkDim)] font-mono text-[10px] uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 w-[40px] text-center">#</th>
                                    <th className="p-4 w-[30%]">Decision Area</th>
                                    <th className="p-4 w-[15%] text-center border-l border-[var(--border2)] text-[var(--accent)] bg-[rgba(var(--accent-rgb),0.08)]">Responsible (R)</th>
                                    <th className="p-4 w-[15%] text-center border-l border-[var(--border2)] text-[var(--risk)] bg-[rgba(255,59,59,0.05)]">Accountable (A)</th>
                                    <th className="p-4 w-[15%] text-center border-l border-[var(--border2)] text-[var(--safe)] bg-[rgba(0,224,112,0.05)]">Consulted (C)</th>
                                    <th className="p-4 w-[15%] text-center border-l border-[var(--border2)] text-[var(--ink)] bg-[var(--surface)]">Informed (I)</th>
                                    {canEdit() && <th className="p-4 w-[40px]"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border2)]">
                                {raciRows.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-[var(--surface2)] transition-colors group">
                                        <td className="p-4 text-center text-[var(--inkDim)] font-mono text-[10px]">{idx + 1}</td>
                                        
                                        {/* Decision Area */}
                                        <td className="p-4">
                                            {canEdit() ? (
                                                <input 
                                                    value={row.area}
                                                    onChange={(e) => handleRaciChange(row.id, 'area', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] outline-none font-medium text-sm transition-colors py-1 text-[var(--ink)]"
                                                />
                                            ) : (
                                                <span className="font-medium text-sm text-[var(--ink)]">{row.area}</span>
                                            )}
                                        </td>
                                        
                                        {/* Responsible */}
                                        <td className="p-2 border-l border-[var(--border2)] bg-[rgba(var(--accent-rgb),0.02)]">
                                            <div className="flex justify-center">
                                                <div className="relative w-full max-w-[120px]">
                                                    <select 
                                                      value={row.r} 
                                                      onChange={(e) => handleRaciChange(row.id, 'r', e.target.value)}
                                                      className={`w-full bg-transparent text-center text-xs font-bold outline-none cursor-pointer py-2 px-1 rounded-lg border border-transparent hover:border-[var(--border)] appearance-none ${row.r ? 'text-[var(--accent)] bg-[var(--surface)] shadow-sm' : 'text-[var(--inkDim)] opacity-50'}`}
                                                      disabled={!canEdit()}
                                                    >
                                                        <option value="" className="bg-[var(--surface)] text-[var(--ink)]">--</option>
                                                        {state.settings.taxonomy.roleKeys.map(rk => (
                                                            <option key={rk.key} value={rk.key} className="bg-[var(--surface)] text-[var(--ink)]">{rk.name} ({rk.key})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Accountable */}
                                        <td className="p-2 border-l border-[var(--border2)] bg-[rgba(255,59,59,0.02)]">
                                            <div className="flex flex-wrap justify-center gap-1">
                                                {state.settings.taxonomy.roleKeys.map(rk => (
                                                    <button
                                                        key={rk.key}
                                                        onClick={() => handleRaciChange(row.id, 'a', rk.key)} // Single select
                                                        disabled={!canEdit()}
                                                        className={`w-6 h-6 rounded-md text-[9px] font-bold transition-all flex items-center justify-center border
                                                            ${row.a === rk.key 
                                                                ? 'bg-[var(--risk)] border-[var(--risk)] text-white shadow-md' 
                                                                : 'bg-transparent border-transparent text-[var(--inkDim)] hover:bg-[var(--surface)] opacity-30 hover:opacity-100'}
                                                        `}
                                                        title={`Accountable: ${rk.name}`}
                                                    >
                                                        {rk.key}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        
                                        {/* Consulted */}
                                        <td className="p-2 border-l border-[var(--border2)] bg-[rgba(0,224,112,0.02)]">
                                            <div className="flex flex-wrap justify-center gap-1">
                                               {state.settings.taxonomy.roleKeys.map(rk => {
                                                   const isActive = row.c.includes(rk.key);
                                                   return (
                                                       <button 
                                                          key={rk.key}
                                                          onClick={() => {
                                                              const newC = isActive ? row.c.filter(x => x !== rk.key) : [...row.c, rk.key];
                                                              handleRaciChange(row.id, 'c', newC);
                                                          }}
                                                          disabled={!canEdit()}
                                                          className={`
                                                              w-6 h-6 rounded-md text-[9px] font-bold transition-all flex items-center justify-center border
                                                              ${isActive 
                                                                  ? 'bg-[var(--safe)] border-[var(--safe)] text-white shadow-sm' 
                                                                  : 'bg-transparent border-transparent text-[var(--inkDim)] opacity-30 hover:opacity-100 hover:bg-[var(--surface)]'
                                                              }
                                                          `}
                                                          title={`Consulted: ${rk.name}`}
                                                       >
                                                           {rk.key}
                                                       </button>
                                                   )
                                               })}
                                            </div>
                                        </td>
                                        
                                        {/* Informed */}
                                        <td className="p-2 border-l border-[var(--border2)]">
                                            <div className="flex flex-wrap justify-center gap-1">
                                               {state.settings.taxonomy.roleKeys.map(rk => {
                                                   const isActive = row.i.includes(rk.key);
                                                   return (
                                                       <button 
                                                          key={rk.key}
                                                          onClick={() => {
                                                              const newI = isActive ? row.i.filter(x => x !== rk.key) : [...row.i, rk.key];
                                                              handleRaciChange(row.id, 'i', newI);
                                                          }}
                                                          disabled={!canEdit()}
                                                          className={`
                                                              w-6 h-6 rounded-md text-[9px] font-bold transition-all flex items-center justify-center border
                                                              ${isActive 
                                                                  ? 'bg-[var(--surface)] border-[var(--inkDim)] text-[var(--ink)] shadow-sm' 
                                                                  : 'bg-transparent border-transparent text-[var(--inkDim)] opacity-30 hover:opacity-100 hover:bg-[var(--surface)]'
                                                              }
                                                          `}
                                                          title={`Informed: ${rk.name}`}
                                                       >
                                                           {rk.key}
                                                       </button>
                                                   )
                                               })}
                                            </div>
                                        </td>
                                        
                                        {canEdit() && (
                                            <td className="p-4 text-center">
                                                <button onClick={() => deleteRaciRow(row.id)} className="text-[var(--inkDim)] hover:text-[var(--risk)] transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                      
                      {/* Footer Legend */}
                      <div className="p-4 bg-[var(--surface2)] border-t border-[var(--border)] flex gap-6 text-[10px] font-mono text-[var(--inkDim)] uppercase justify-center flex-wrap">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span> Responsible (Doer)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--risk)]"></span> Accountable (Owner)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--safe)]"></span> Consulted (Input)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--ink)]"></span> Informed (FYI)</div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
