
import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { AppState, Person, WorkItem, Pack, RaidItem, Decision, RaciRow, Report, Comment, AuditLog, WorkloadSettings, AppSettings, AppContextProps } from '../types';
import { seedV10, STORAGE_KEY } from '../constants';

const MAX_AUDIT_LOGS = 500;

type Action =
  | { type: 'SET_VIEW'; payload: { view: string; workId?: string; personId?: string } }
  | { type: 'GO_BACK' }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_WORK'; payload: WorkItem }
  | { type: 'ADD_WORK'; payload: WorkItem }
  | { type: 'UPDATE_PACK'; payload: { workId: string; pack: Partial<Pack> } }
  | { type: 'ADD_COMMENT'; payload: { workId: string; text: string } }
  | { type: 'SET_CURRENT_USER'; payload: string }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'UPDATE_FILTER'; payload: Partial<AppState['ui']['filters']> }
  | { type: 'SET_PROJECT_TAB'; payload: string }
  | { type: 'RESET_STATE'; payload: any }
  | { type: 'IMPORT_DATA'; payload: { people: Person[]; workItems: WorkItem[] } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'UPDATE_WORKLOAD_SETTINGS'; payload: { fullSettings: AppSettings; diff: any; note?: string } }
  | { type: 'RESTORE_WORKLOAD_VERSION'; payload: WorkloadSettings };

const initialState: AppState = {
    ...seedV10,
    ui: {
        ...seedV10.ui,
        history: [] // Ensure history exists
    }
};

const createAudit = (userId: string, type: string, id: string, action: string, diff: any): AuditLog => ({
    id: `AUD-${Date.now()}`,
    ts: new Date().toISOString(),
    entity: { type, id },
    action,
    diff,
    userId
});

// Helper: Ensure incoming data conforms to AppState structure (Data Integrity)
const sanitizeState = (incoming: any): AppState => {
    if (!incoming || typeof incoming !== 'object') return { ...initialState };

    // Shallow merge top-level to capture new root keys if any
    const safeState: AppState = {
        ...initialState,
        ...incoming,
        // Deep merge critical nested objects
        ui: { 
            ...initialState.ui, 
            ...(incoming.ui || {}),
            filters: { ...initialState.ui.filters, ...(incoming.ui?.filters || {}) }
        },
        settings: { 
            ...initialState.settings, 
            ...(incoming.settings || {}),
            taxonomy: { ...initialState.settings.taxonomy, ...(incoming.settings?.taxonomy || {}) },
            workload: { ...initialState.settings.workload, ...(incoming.settings?.workload || {}) },
            // Deep merge weights to ensure governance rules exist even if loading legacy data
            weights: {
                ...initialState.settings.weights,
                ...(incoming.settings?.weights || {}),
                governance: {
                    ...initialState.settings.weights.governance,
                    ...(incoming.settings?.weights?.governance || {})
                }
            }
        }
    };

    // Ensure Top-Level Arrays exist
    if (!Array.isArray(safeState.people)) safeState.people = [];
    if (!Array.isArray(safeState.workItems)) safeState.workItems = [];
    if (!safeState.packs || typeof safeState.packs !== 'object') safeState.packs = {};
    if (!Array.isArray(safeState.audit)) safeState.audit = [];
    if (!Array.isArray(safeState.ui.history)) safeState.ui.history = [];
    if (!Array.isArray(safeState.settings.workloadHistory)) safeState.settings.workloadHistory = [];

    // DEEP SANITIZATION: Protect against array access on undefined properties in entities
    safeState.workItems = safeState.workItems.map(w => ({
        ...w,
        staffing: Array.isArray(w.staffing) ? w.staffing : [],
        externalPartners: Array.isArray(w.externalPartners) ? w.externalPartners : []
    }));

    safeState.people = safeState.people.map(p => ({
        ...p,
        profile: {
            ...p.profile,
            skills: Array.isArray(p.profile?.skills) ? p.profile.skills : [],
            directReports: Array.isArray(p.profile?.directReports) ? p.profile.directReports : [],
            recurringRoles: Array.isArray(p.profile?.recurringRoles) ? p.profile.recurringRoles : []
        }
    }));

    return safeState;
};

// Helper: For initial boot only - injects seed data if storage is empty
const bootState = (incoming: any): AppState => {
    const state = sanitizeState(incoming);
    // If effectively empty (no people/projects), inject seed data
    if (state.people.length === 0 && state.workItems.length === 0) {
         return { ...seedV10, ui: { ...seedV10.ui, history: [] } };
    }
    return state;
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      // Record current state to history before changing
      const historyEntry = { 
          view: state.ui.view, 
          activeWorkId: state.ui.activeWorkId, 
          activePersonId: state.ui.activePersonId 
      };
      
      // Limit history stack to 20 items to prevent memory bloat
      const newHistory = [...(state.ui.history || []), historyEntry].slice(-20);

      return {
        ...state,
        ui: {
          ...state.ui,
          view: action.payload.view,
          activeWorkId: action.payload.workId || null,
          activePersonId: action.payload.personId || null,
          history: newHistory
        }
      };
    case 'GO_BACK':
      const history = state.ui.history || [];
      if (history.length === 0) return state; // Nowhere to go

      const prev = history[history.length - 1];
      return {
          ...state,
          ui: {
              ...state.ui,
              view: prev.view,
              activeWorkId: prev.activeWorkId,
              activePersonId: prev.activePersonId,
              history: history.slice(0, -1)
          }
      };
    case 'SET_THEME':
      return { ...state, ui: { ...state.ui, theme: action.payload as 'dark'|'light' } };
    case 'SET_CURRENT_USER':
      return { ...state, ui: { ...state.ui, currentUser: action.payload } };
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
        audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Person', action.payload.id, 'UPDATE', {})].slice(-MAX_AUDIT_LOGS)
      };
    case 'ADD_PERSON':
      const newPerson = { ...action.payload };
      if (newPerson.profile.capacityModifier === undefined) newPerson.profile.capacityModifier = 10;
      
      return {
        ...state,
        people: [newPerson, ...state.people],
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Person', action.payload.id, 'CREATE', {})].slice(-MAX_AUDIT_LOGS)
      };
    case 'UPDATE_WORK':
      return {
        ...state,
        workItems: state.workItems.map(w => w.id === action.payload.id ? action.payload : w),
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Work', action.payload.id, 'UPDATE', {})].slice(-MAX_AUDIT_LOGS)
      };
    case 'ADD_WORK':
      const newPack: Pack = { raid: [], raci: [], decisions: [], reports: [], comments: [], updatedAt: new Date().toISOString() };
      const newWork = { ...action.payload };
      if(!newWork.complexity) newWork.complexity = 3;

      return {
        ...state,
        workItems: [newWork, ...state.workItems],
        packs: { ...state.packs, [action.payload.id]: newPack },
        meta: { ...state.meta, updatedAt: new Date().toISOString() },
        audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Work', action.payload.id, 'CREATE', {})].slice(-MAX_AUDIT_LOGS)
      };
    case 'UPDATE_PACK':
      return {
        ...state,
        packs: {
          ...state.packs,
          [action.payload.workId]: { ...state.packs[action.payload.workId], ...action.payload.pack, updatedAt: new Date().toISOString() }
        },
        meta: { ...state.meta, updatedAt: new Date().toISOString() }
      };
    case 'ADD_COMMENT':
        // Fix: Ensure pack exists before adding comment
        const existingPack = state.packs[action.payload.workId] || { 
            raid: [], raci: [], decisions: [], reports: [], comments: [], updatedAt: new Date().toISOString() 
        };
        const newComment: Comment = {
            id: `C-${Date.now()}`,
            text: action.payload.text,
            authorId: state.ui.currentUser || 'ANON',
            createdAt: new Date().toISOString()
        };
        return {
            ...state,
            packs: {
                ...state.packs,
                [action.payload.workId]: { ...existingPack, comments: [newComment, ...existingPack.comments] }
            }
        };
    case 'UPDATE_FILTER':
      return {
        ...state,
        ui: { ...state.ui, filters: { ...state.ui.filters, ...action.payload } }
      };
    case 'SET_PROJECT_TAB':
      return { ...state, ui: { ...state.ui, projectTab: action.payload } };
    case 'RESET_STATE':
      // Sanitize the imported state to prevent crashes
      return sanitizeState(action.payload);
    case 'IMPORT_DATA':
      const newPeople = [...state.people];
      action.payload.people.forEach(p => {
        if (!newPeople.some(ex => ex.id === p.id)) newPeople.push(p);
      });
      const newWorkItems = [...state.workItems];
      const newPacks = { ...state.packs };
      action.payload.workItems.forEach(w => {
        if (!newWorkItems.some(ex => ex.id === w.id)) {
          newWorkItems.push(w);
          newPacks[w.id] = { raid: [], raci: [], decisions: [], reports: [], comments: [], updatedAt: new Date().toISOString() };
        }
      });
      return {
        ...state,
        people: newPeople,
        workItems: newWorkItems,
        packs: newPacks,
        meta: { ...state.meta, updatedAt: new Date().toISOString() }
      };
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: { ...state.settings, ...action.payload },
            audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Settings', 'Global', 'UPDATE', {})].slice(-MAX_AUDIT_LOGS)
        };
    case 'UPDATE_WORKLOAD_SETTINGS':
        const newVersionEntry = {
            id: `V${Date.now()}`,
            ts: new Date().toISOString(),
            userId: state.ui.currentUser || 'SYS',
            config: action.payload.fullSettings.workload,
            note: action.payload.note || 'Manual Update'
        };
        const updatedHistory = [newVersionEntry, ...(state.settings.workloadHistory || [])].slice(0, 50); // Keep last 50 versions

        return {
            ...state,
            settings: { 
                ...action.payload.fullSettings,
                workloadHistory: updatedHistory
            },
            audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Settings', 'Workload', 'UPDATE', action.payload.diff)].slice(-MAX_AUDIT_LOGS)
        };
    case 'RESTORE_WORKLOAD_VERSION':
        const restoreVersionEntry = {
            id: `V${Date.now()}-RESTORE`,
            ts: new Date().toISOString(),
            userId: state.ui.currentUser || 'SYS',
            config: action.payload,
            note: 'Restored from previous version'
        };
        const restoreHistory = [restoreVersionEntry, ...(state.settings.workloadHistory || [])];

        return {
            ...state,
            settings: {
                ...state.settings,
                workload: action.payload,
                workloadHistory: restoreHistory
            },
            audit: [...state.audit, createAudit(state.ui.currentUser || 'SYS', 'Settings', 'Workload', 'RESTORE', {})].slice(-MAX_AUDIT_LOGS)
        };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextProps>({ 
    state: initialState, 
    dispatch: () => null,
    lastSaveTime: null
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? bootState(JSON.parse(stored)) : bootState(initial);
    } catch (e) {
      console.error("Failed to load state from storage:", e);
      return bootState(initial);
    }
  });

  // Debounced persistence to avoid localStorage churn on every keystroke/update
  useEffect(() => {
    const handler = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setLastSaveTime(new Date()); // Update timestamp on successful save
        } catch (e) {
            console.error("Storage limit reached or error saving:", e);
        }
    }, 500); // 500ms debounce

    // Immediate theme update to prevent flicker
    if (state.ui.theme === 'light') {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }

    return () => clearTimeout(handler);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch, lastSaveTime }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
