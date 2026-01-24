
import React, { useState } from 'react';
import { LayoutGrid, Briefcase, Users, Settings, Calendar as CalendarIcon, LogOut, ChevronLeft, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { AccessLevel } from '../types';

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { view, currentUser, sidebarCollapsed } = state.ui;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const user = state.people.find(p => p.id === currentUser);
  const tier = Compute.getAccessLevel(currentUser);
  const tierName = AccessLevel[tier]?.split('_')[1] || 'User';

  const navItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutGrid },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'people', label: 'People', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    // Only show Settings for Tier 1 (Strategic) & 2 (Tactical)
    ...(tier <= 2 ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  const handleLogoClick = () => {
      dispatch({ type: 'SET_VIEW', payload: { view: 'dash' } });
  };

  return (
    <aside 
      className={`
        relative h-full bg-[var(--surface)] border-r border-[var(--border)] 
        flex flex-col shrink-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-50
        ${sidebarCollapsed ? 'w-[88px]' : 'w-[280px]'}
        print:hidden
      `}
    >
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_40%)] pointer-events-none"></div>

        {/* Floating Toggle Button */}
        <button 
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className={`
                absolute -right-4 top-10 w-8 h-8 bg-[var(--surface)] border border-[var(--border)] rounded-full 
                flex items-center justify-center text-[var(--inkDim)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:scale-110 
                shadow-lg transition-all duration-300 z-50 group
            `}
        >
            <ChevronLeft 
                size={16} 
                className={`transition-transform duration-500 ${sidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} 
            />
        </button>

        {/* Logo Section */}
        <div 
            onClick={handleLogoClick}
            className={`
                relative flex items-center h-[70px] border-b border-[var(--border)] cursor-pointer group overflow-hidden shrink-0
                ${sidebarCollapsed ? 'justify-center' : 'px-6'}
            `}
        >
            {sidebarCollapsed ? (
                <span className="font-disp font-black text-3xl tracking-tighter text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors animate-scale-in">m</span>
            ) : (
                <div className="flex flex-col animate-fade-in min-w-max">
                    <h1 className="font-disp font-bold text-2xl leading-none text-[var(--ink)] tracking-tight group-hover:text-[var(--accent)] transition-colors duration-300 lowercase">murty</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-0.5 w-3 bg-[var(--accent)] rounded-full"></div>
                        <span className="font-mono text-[9px] text-[var(--inkDim)] uppercase tracking-widest group-hover:text-[var(--ink)] transition-colors">Governance Cockpit v1.12</span>
                    </div>
                </div>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-4 overflow-y-auto custom-scrollbar flex-1 relative">
            {navItems.map((item) => {
                const active = view === item.id || (view === 'person' && item.id === 'people') || (view === 'project' && item.id === 'portfolio');
                return (
                    <div key={item.id} className="relative group/nav"
                         onMouseEnter={() => sidebarCollapsed && setHoveredItem(item.id)}
                         onMouseLeave={() => sidebarCollapsed && setHoveredItem(null)}
                    >
                        <button
                            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: item.id } })}
                            className={`
                                relative w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 z-10
                                ${active 
                                    ? 'text-[var(--ink)] bg-gradient-to-r from-[var(--surface2)] to-transparent shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)]' 
                                    : 'text-[var(--inkDim)] hover:text-[var(--ink)] hover:bg-[var(--surface2)]/50'}
                                ${sidebarCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            {/* Active Indicator (Left Bar) */}
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-[var(--accent)] rounded-r-full transition-all duration-300 ${active ? 'h-6 opacity-100 shadow-[0_0_12px_var(--accent)]' : 'h-0 opacity-0'}`}></div>

                            <item.icon 
                                size={sidebarCollapsed ? 22 : 20} 
                                strokeWidth={active ? 2.5 : 2}
                                className={`shrink-0 transition-all duration-300 ${active ? 'text-[var(--accent)] scale-110' : 'group-hover/nav:text-[var(--ink)] group-hover/nav:scale-105'}`} 
                            />
                            
                            {!sidebarCollapsed && (
                                <span className={`text-[13px] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${active ? 'font-bold opacity-100 translate-x-0' : 'font-medium opacity-90'}`}>
                                    {item.label}
                                </span>
                            )}
                        </button>

                        {/* Collapsed Tooltip */}
                        {sidebarCollapsed && hoveredItem === item.id && (
                            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 animate-slide-in-right origin-left">
                                <div className="bg-[var(--ink)] text-[var(--bg)] text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap relative">
                                    {item.label}
                                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-[var(--ink)]"></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>

        {/* User Profile Section */}
        <div className={`mt-auto p-4 shrink-0 transition-all duration-500 ${sidebarCollapsed ? 'items-center gap-4' : 'border-t border-[var(--border2)]'}`}>
            <div className={`
                flex items-center rounded-2xl bg-[var(--surface2)]/30 border border-[var(--border)] transition-all duration-300
                ${sidebarCollapsed ? 'flex-col p-2 gap-3 bg-transparent border-transparent' : 'p-3 gap-3 hover:border-[var(--accent)]/30 hover:bg-[var(--surface2)]/50'}
            `}>
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--surface2)] to-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] shadow-md">
                        {user ? (
                            <span className="font-bold text-xs">{user.name.substring(0,2).toUpperCase()}</span>
                        ) : <User size={18} />}
                    </div>
                    {/* Online Status Dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--safe)] border-2 border-[var(--surface)] rounded-full"></div>
                </div>

                {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="text-[13px] font-bold truncate text-[var(--ink)]">{user?.name}</div>
                        <div className="text-[10px] text-[var(--accent)] font-mono truncate tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                            Tier {tier}: {tierName}
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button 
                    onClick={() => dispatch({ type: 'LOGOUT' })} 
                    className={`
                        flex items-center justify-center rounded-xl text-[var(--inkDim)] hover:text-white hover:bg-[var(--risk)] transition-all duration-200
                        ${sidebarCollapsed ? 'w-10 h-10 border border-[var(--border)] hover:border-[var(--risk)] bg-[var(--surface2)]' : 'p-2 ml-auto hover:shadow-lg'}
                    `}
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    </aside>
  );
};
