
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { Calendar as CalendarIcon, Clock, CheckCircle, List, Grid, ChevronLeft, ChevronRight, Briefcase, Flag, AlertTriangle, Layers, ArrowRight, XCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [viewMode, setViewMode] = useState<'month'|'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animationKey, setAnimationKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => {
          setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Derive events from work items
  // We treat ISO dates (YYYY-MM-DDT...) as absolute dates for the calendar, 
  // ignoring time components to prevent timezone shifts.
  const events = useMemo(() => {
      const all: any[] = [];
      state.workItems.forEach(w => {
          const pack = state.packs[w.id];
          if(pack && pack.raid) {
              pack.raid.forEach(r => {
                  if(r.due && r.status !== 'Closed') {
                      all.push({
                          date: r.due.split('T')[0],
                          type: 'raid',
                          title: r.title,
                          workId: w.id,
                          workName: w.name,
                          subType: r.type,
                          id: r.id,
                          status: r.status,
                          impact: r.impact
                      });
                  }
              });
          }
          if(w.endDate) {
              all.push({
                  date: w.endDate.split('T')[0],
                  type: 'project',
                  title: 'Project End Date',
                  workId: w.id,
                  workName: w.name,
                  id: w.id
              });
          }
          if(w.startDate) {
              all.push({
                  date: w.startDate.split('T')[0],
                  type: 'milestone',
                  title: 'Kick-off',
                  workId: w.id,
                  workName: w.name,
                  id: w.id
              });
          }
      });
      return all.sort((a,b) => a.date.localeCompare(b.date));
  }, [state.workItems, state.packs]);

  // Calendar Calculation Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const days = Array.from({length: daysInMonth}, (_, i) => {
      const day = i + 1;
      // Construct date string manually as YYYY-MM-DD to match the events source data
      const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
      return {
          day,
          dateStr,
          events: events.filter(e => e.date === dateStr)
      };
  });

  const nextMonth = () => {
      setCurrentDate(new Date(year, month + 1, 1));
      setAnimationKey(prev => prev + 1);
  };
  const prevMonth = () => {
      setCurrentDate(new Date(year, month - 1, 1));
      setAnimationKey(prev => prev + 1);
  };
  
  // Use local ISO string for 'Today' to match the event date keys
  // This ensures 'Today' highlights correctly based on user's browser day, matching the date buckets
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  const getEventStyle = (e: any) => {
      if (e.type === 'project') return 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-md';
      if (e.type === 'milestone') return 'bg-[var(--surface)] text-[var(--ink)] border-[var(--safe)] border-l-4';
      if (e.type === 'raid') {
          if (e.impact === 'High') return 'bg-[var(--risk)] text-white border-[var(--risk)] shadow-sm';
          return 'bg-[var(--warn)] text-black border-[var(--warn)] shadow-sm';
      }
      return 'bg-[var(--surface2)] text-[var(--inkDim)] border-[var(--border)]';
  };

  const getEventIcon = (e: any) => {
      if (e.type === 'project') return <Briefcase size={10} />;
      if (e.type === 'milestone') return <Flag size={10} />;
      if (e.type === 'raid') return <AlertTriangle size={10} />;
      return <div className="w-1.5 h-1.5 rounded-full bg-current" />;
  };

  // Mobile Dot Indicator for Month View
  const getDotColor = (e: any) => {
      if (e.type === 'project') return 'bg-[var(--ink)]';
      if (e.type === 'milestone') return 'bg-[var(--safe)]';
      if (e.type === 'raid' && e.impact === 'High') return 'bg-[var(--risk)]';
      return 'bg-[var(--warn)]';
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-8">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
            <div>
                <h2 className="font-disp font-bold text-2xl sm:text-3xl tracking-tight text-[var(--ink)]">Calendar</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="text-sm text-[var(--inkDim)] font-mono uppercase tracking-wide">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    {todayStr.startsWith(`${year}-${(month+1).toString().padStart(2,'0')}`) && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--bg)] text-[9px] font-bold uppercase tracking-wider animate-pulse">Current</span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center bg-[var(--surface2)] rounded-xl p-1 border border-[var(--border)] shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-[var(--surface)] hover:text-[var(--accent)] rounded-lg transition-colors"><ChevronLeft size={16}/></button>
                <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
                <button onClick={nextMonth} className="p-2 hover:bg-[var(--surface)] hover:text-[var(--accent)] rounded-lg transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
        
        {/* Toggle - Now visible on mobile too */}
        <div className="flex items-center gap-1 bg-[var(--surface2)] p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto w-full sm:w-auto">
             <button 
                onClick={() => setViewMode('agenda')}
                className={`flex-1 sm:flex-none justify-center p-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase ${viewMode === 'agenda' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
             >
                 <List size={16} /> Agenda
             </button>
             <button 
                onClick={() => setViewMode('month')}
                className={`flex-1 sm:flex-none justify-center p-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase ${viewMode === 'month' ? 'bg-[var(--surface)] shadow-sm text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
             >
                 <Grid size={16} /> Month
             </button>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl transition-all relative">
          
          {viewMode === 'month' ? (
              <div key={animationKey} className="flex-1 flex flex-col h-[600px] md:h-auto overflow-y-auto">
                  {/* Days Header */}
                  <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface)] z-10 shadow-sm sticky top-0">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="py-2 sm:py-4 text-center text-[9px] sm:text-[10px] font-black uppercase text-[var(--inkDim)] tracking-widest opacity-70">
                              {isMobile ? d.charAt(0) : d}
                          </div>
                      ))}
                  </div>
                  
                  {/* Grid */}
                  <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-[var(--surface2)] gap-px border-b border-[var(--border)]">
                      {/* Empty Cells from previous month */}
                      {Array.from({length: firstDayOfWeek}, (_, i) => (
                          <div key={`empty-${i}`} className="bg-[var(--card)]/50 opacity-50" />
                      ))}
                      
                      {/* Day Cells */}
                      {days.map((d, i) => {
                          const isToday = d.dateStr === todayStr;
                          const hasEvents = d.events.length > 0;
                          
                          return (
                              <div 
                                key={d.dateStr} 
                                onClick={() => {
                                    if (isMobile && hasEvents) setViewMode('agenda');
                                }}
                                className={`
                                    min-h-[70px] sm:min-h-[120px] p-1 sm:p-2 bg-[var(--card)] hover:bg-[var(--surface)] transition-all duration-300 flex flex-col relative group overflow-hidden cursor-pointer
                                    ${isToday ? 'bg-[var(--surface)] shadow-inner ring-1 ring-[var(--accent)]/20 inset-0' : ''}
                                    animate-slide-up
                                `}
                                style={{ animationDelay: `${i * 0.015}s`, animationFillMode: 'both' }}
                              >
                                  {/* Top Bar */}
                                  <div className="flex justify-between items-start mb-1 sm:mb-2 z-10">
                                      <div className={`
                                          text-[10px] sm:text-xs font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-all
                                          ${isToday 
                                              ? 'bg-[var(--accent)] text-[var(--bg)] shadow-lg scale-110' 
                                              : 'text-[var(--inkDim)] group-hover:text-[var(--ink)] group-hover:bg-[var(--surface2)]'
                                          }
                                      `}>
                                          {d.day}
                                      </div>
                                      {hasEvents && !isMobile && <div className="text-[9px] font-mono text-[var(--inkDim)] opacity-0 group-hover:opacity-50 transition-opacity">{d.events.length}</div>}
                                  </div>
                                  
                                  {/* Events List (Desktop) / Dots (Mobile) */}
                                  <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 overflow-y-auto custom-scrollbar z-10">
                                      {!isMobile ? (
                                          <>
                                              {d.events.slice(0, 4).map((e, idx) => (
                                                  <div key={`${e.id}-${idx}`} 
                                                    onClick={(ev) => { ev.stopPropagation(); dispatch({ type: 'SET_VIEW', payload: { view: 'project', workId: e.workId } }); }}
                                                    className={`
                                                        flex items-center gap-2 px-1.5 py-1 rounded-[4px] sm:rounded-[6px] border text-[8px] sm:text-[9px] font-bold cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md
                                                        ${getEventStyle(e)}
                                                    `}
                                                    title={`${e.workName}: ${e.title}`}
                                                  >
                                                      <span className="shrink-0 opacity-90 hidden sm:block">{getEventIcon(e)}</span>
                                                      <span className="truncate opacity-95">{isMobile ? '' : e.workName}</span>
                                                  </div>
                                              ))}
                                              {d.events.length > 4 && (
                                                  <div className="text-[9px] text-[var(--inkDim)] text-center font-bold hover:text-[var(--accent)] cursor-pointer mt-auto pt-1">
                                                      + {d.events.length - 4}
                                                  </div>
                                              )}
                                          </>
                                      ) : (
                                          /* Mobile Dots View */
                                          <div className="flex flex-wrap gap-1 p-1 items-center justify-center content-end h-full pb-2">
                                              {d.events.map((e, idx) => (
                                                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getDotColor(e)}`}></div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                      
                      {/* Fill empty cells to complete grid if necessary */}
                      {Array.from({length: (7 - (firstDayOfWeek + daysInMonth) % 7) % 7}, (_, i) => (
                          <div key={`post-empty-${i}`} className="bg-[var(--card)]/30" />
                      ))}
                  </div>
              </div>
          ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-0 sm:p-6 space-y-2 sm:space-y-8 animate-slide-up bg-[var(--surface)]/50">
                  {days.filter(d => d.events.length > 0).map(d => {
                      const isToday = d.dateStr === todayStr;
                      const dateObj = new Date(d.dateStr); // safe because YYYY-MM-DD in constructor is local
                      return (
                          <div key={d.dateStr} className="flex flex-col sm:flex-row gap-0 sm:gap-6 items-stretch sm:items-start group border-b border-[var(--border2)] sm:border-0 last:border-0">
                              {/* Date Column */}
                              <div className="w-full sm:w-24 bg-[var(--surface2)] sm:bg-transparent px-4 py-2 sm:p-0 flex flex-row sm:flex-col items-center sm:items-center justify-between sm:justify-start shrink-0 sticky top-0 sm:static z-10 sm:z-0 border-b sm:border-0 border-[var(--border)]">
                                  <div className="flex items-center gap-2 sm:flex-col">
                                      <div className={`text-xl sm:text-3xl font-disp font-black ${isToday ? 'text-[var(--accent)] scale-110' : 'text-[var(--ink)]'} transition-transform`}>{d.day}</div>
                                      <div className="text-xs font-mono font-bold text-[var(--inkDim)] uppercase tracking-wider">{dateObj.toLocaleString('default', { weekday: 'short' })}</div>
                                  </div>
                                  {isToday && <div className="sm:mt-2 px-2 py-0.5 bg-[var(--accent)] text-[var(--bg)] text-[9px] font-bold rounded-full uppercase">Today</div>}
                              </div>
                              
                              {/* Events Column */}
                              <div className="flex-1 space-y-3 p-4 sm:p-0 sm:pb-8 sm:border-l border-[var(--border)] sm:pl-8 relative w-full">
                                  <div className={`absolute -left-[5px] top-[18px] w-2.5 h-2.5 rounded-full border-2 transition-colors hidden sm:block ${isToday ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--border)] border-[var(--bg)]'}`}></div>
                                  
                                  {d.events.map((e, idx) => (
                                      <div key={idx} 
                                        onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'project', workId: e.workId } })}
                                        className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] hover:shadow-lg cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/card"
                                      >
                                          <div className="flex items-start sm:items-center gap-4">
                                               <div className={`p-3 rounded-xl transition-colors shrink-0 ${e.type === 'project' ? 'bg-[var(--surface2)] text-[var(--ink)]' : e.type === 'milestone' ? 'bg-[rgba(0,224,112,0.1)] text-[var(--safe)]' : 'bg-[rgba(255,192,0,0.1)] text-[var(--warn)]'}`}>
                                                   {e.type === 'project' ? <Briefcase size={20} /> : e.type === 'milestone' ? <Flag size={20} /> : <Clock size={20} />}
                                               </div>
                                               <div className="min-w-0">
                                                   <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                       <span className="text-[10px] font-bold font-mono uppercase text-[var(--inkDim)] tracking-wider border border-[var(--border)] px-1.5 py-0.5 rounded bg-[var(--surface2)] truncate max-w-[150px]">{e.workName}</span>
                                                       {e.type === 'raid' && <span className="text-[9px] bg-[var(--warn)] text-black px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">Due</span>}
                                                   </div>
                                                   <div className="font-bold text-sm text-[var(--ink)] group-hover/card:text-[var(--accent)] transition-colors break-words">{e.title}</div>
                                               </div>
                                          </div>
                                          <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto">
                                              <button className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-bold uppercase hover:bg-[var(--surface2)] transition-colors bg-[var(--bg)] flex items-center gap-2 opacity-100 sm:opacity-0 group-hover/card:opacity-100 transform sm:translate-x-2 group-hover/card:translate-x-0 w-full sm:w-auto justify-center">View <ArrowRight size={14}/></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
                  {days.every(d => d.events.length === 0) && (
                      <div className="flex flex-col items-center justify-center h-full p-20 opacity-50">
                          <Layers size={48} className="text-[var(--inkDim)] mb-4 stroke-1 opacity-20"/>
                          <div className="text-[var(--inkDim)] font-mono uppercase text-sm">No events scheduled this month</div>
                          <button onClick={nextMonth} className="mt-4 text-[var(--accent)] text-xs font-bold uppercase hover:underline">Check Next Month</button>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
