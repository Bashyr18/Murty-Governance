
import React from 'react';
import { LayoutGrid, Briefcase, Users, Settings, Calendar, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { openDrawer } from './Drawer';
import { toast } from './Toasts';

export const MobileNav: React.FC = () => {
  const { state, dispatch } = useApp();
  const { view, currentUser } = state.ui;

  const tier = Compute.getAccessLevel(currentUser);

  const navItems = [
    { id: 'dash', icon: LayoutGrid, label: 'Dash' },
    { id: 'portfolio', icon: Briefcase, label: 'Work' },
    { id: 'people', icon: Users, label: 'Team' },
    { id: 'calendar', icon: Calendar, label: 'Cal' },
    // Conditionally show settings
    ...(tier <= 2 ? [{ id: 'settings', icon: Settings, label: 'Config' }] : []),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--surfaceGlass)] backdrop-blur-xl border-t border-[var(--border)] pb-safe z-50 px-4 py-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const active = view === item.id || (view === 'person' && item.id === 'people') || (view === 'project' && item.id === 'portfolio');
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: item.id } })}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${active ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] font-bold mt-1 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
