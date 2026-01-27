
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, Person, WorkItem, Pack, AuditLog, WorkloadSettings, AppSettings } from '../types';
import { seedV10, STORAGE_KEY } from '../constants';

type Action =
  | { type: 'SET_VIEW'; payload: { view: string; workId?: string; personId?: string } }
  | { type: 'GO_BACK' }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_WORK'; payload: WorkItem }
  | { type: 'DELETE_WORK'; payload: string }
  | { type: 'ADD_WORK'; payload: WorkItem }
  | { type: 'UPDATE_PACK'; payload: { workId: string; pack: Partial<Pack> } }
  | { type: 'ADD_COMMENT'; payload: { workId: string; text: string } }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'UPDATE_FILTER'; payload: Partial<AppState['ui']['filters']> }
  | { type: 'RESET_STATE'; payload: any }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'UPDATE_WORKLOAD_SETTINGS'; payload: { fullSettings: AppSettings; diff: any; note?: string } };

const initialState: AppState = { ...seedV10, ui: { ...seedV10.ui, history: [] } };

const createAudit = (userId: string, type: string, id: string, action: string, diff: any): AuditLog => ({
    id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
    ts: new Date().toISOString(),
    entity: { type, id },
    action,
    diff,
    userId
});

const reducer = (state: AppState, action: Action): AppState => {
  const user = state.ui.currentUser || 'SYS';
  switch (action.type) {
    case 'SET_VIEW':
      const history = [...(state.ui.history || []), { view: state.ui.view, activeWorkId: state.ui.activeWorkId, activePersonId: state.ui.activePersonId }].slice(-20);
      return { ...state, ui: { ...state.ui, view: action.payload.view, activeWorkId: action.payload.workId || null, activePersonId: action.payload.personId || null, history } };
    case 'GO_BACK':
      if (!state.ui.history?.length) return state;
      const prev = state.ui.history[state.ui.history.length - 1];
      return { ...state, ui: { ...state.ui, ...prev, history: state.ui.history.slice(0, -1) } };
    case 'SET_THEME':
      return { ...state, ui: { ...state.ui, theme: action.payload as 'dark'|'light' } };
    case 'LOGIN':
        return { ...state, ui: { ...state.ui, currentUser: action.payload, isAuthenticated: true, view: 'dash', history: [] } };
    case 'LOGOUT':
        return { ...state, ui: { ...state.ui, currentUser: null, isAuthenticated: false, history: [] } };
    case 'TOGGLE_SIDEBAR':
        return { ...state, ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed } };
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map(p => p.id === action.payload.id ? action.payload : p),
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [createAudit(user, 'Person', action.payload.id, 'UPDATE', {}), ...state.audit].slice(0, 200)
      };
    case 'ADD_PERSON':
      return {
        ...state,
        people: [action.payload, ...state.people],
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [createAudit(user, 'Person', action.payload.id, 'CREATE', {}), ...state.audit].slice(0, 200)
      };
    case 'UPDATE_WORK':
      return {
        ...state,
        workItems: state.workItems.map(w => w.id === action.payload.id ? action.payload : w),
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [createAudit(user, 'Work', action.payload.id, 'UPDATE', {}), ...state.audit].slice(0, 200)
      };
    case 'DELETE_WORK':
        const { [action.payload]: _, ...remainingPacks } = state.packs;
        return {
            ...state,
            workItems: state.workItems.filter(w => w.id !== action.payload),
            packs: remainingPacks,
            ui: { ...state.ui, view: 'portfolio', activeWorkId: null },
            meta: { ...state.meta, updatedAt: new Date().toISOString() },
            audit: [createAudit(user, 'Work', action.payload, 'DELETE', {}), ...state.audit].slice(0, 200)
        };
    case 'ADD_WORK':
      return {
        ...state,
        workItems: [action.payload, ...state.workItems],
        packs: { ...state.packs, [action.payload.id]: { raid: [], raci: [], decisions: [], reports: [], comments: [], updatedAt: new Date().toISOString() } },
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [createAudit(user, 'Work', action.payload.id, 'CREATE', {}), ...state.audit].slice(0, 200)
      };
    case 'UPDATE_PACK':
      return {
        ...state,
        packs: { ...state.packs, [action.payload.workId]: { ...state.packs[action.payload.workId], ...action.payload.pack, updatedAt: new Date().toISOString() } },
        meta: { ...state.meta, updatedAt: new Date().toISOString() }
      };
    case 'ADD_COMMENT':
        const pack = state.packs[action.payload.workId];
        const newComment = { id: `C-${Date.now()}`, text: action.payload.text, authorId: user, createdAt: new Date().toISOString() };
        return { ...state, packs: { ...state.packs, [action.payload.workId]: { ...pack, comments: [newComment, ...pack.comments] } } };
    case 'UPDATE_FILTER':
      return { ...state, ui: { ...state.ui, filters: { ...state.ui.filters, ...action.payload } } };
    case 'RESET_STATE':
      return { ...action.payload, ui: { ...action.payload.ui, history: [] } };
    case 'UPDATE_SETTINGS':
        return { ...state, settings: { ...state.settings, ...action.payload }, audit: [createAudit(user, 'Settings', 'Global', 'UPDATE', {}), ...state.audit] };
    case 'UPDATE_WORKLOAD_SETTINGS':
        const version = { id: `V${Date.now()}`, ts: new Date().toISOString(), userId: user, config: action.payload.fullSettings.workload, note: action.payload.note || 'Update' };
        return {
            ...state,
            settings: { ...action.payload.fullSettings, workloadHistory: [version, ...(state.settings.workloadHistory || [])].slice(0, 50) },
            audit: [createAudit(user, 'Settings', 'Workload', 'UPDATE', action.payload.diff), ...state.audit]
        };
    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({ state: initialState, dispatch: () => null });
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initial;
    } catch (e) { return initial; }
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};
export const useApp = () => useContext(AppContext);
