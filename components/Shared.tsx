
import React from 'react';
import { useApp } from '../context/AppContext';

// Centralized Unit Color Logic
export const getUnitColor = (unitId?: string) => {
    switch(unitId) {
        case 'U-GG': return 'bg-emerald-600 border-emerald-500 text-emerald-50'; 
        case 'U-TA': return 'bg-indigo-600 border-indigo-500 text-indigo-50';
        case 'U-CS': return 'bg-blue-600 border-blue-500 text-blue-50';
        case 'U-PDM': return 'bg-amber-600 border-amber-500 text-amber-50';
        case 'U-CM': return 'bg-slate-700 border-slate-600 text-slate-50';
        default: return 'bg-slate-500 border-slate-400 text-white';
    }
};

interface AvatarProps {
    name?: string;
    unitId?: string;
    personId?: string | null;
    className?: string;
}

// Smart Avatar Component - Handles both direct props and ID lookup
export const Avatar: React.FC<AvatarProps> = ({ name, unitId, personId, className = "w-8 h-8 text-[10px]" }) => {
    const { state } = useApp();
    
    let displayName = name || "?";
    let displayUnit = unitId;
    
    // Look up person details if ID is provided
    if (personId) {
        const p = state.people.find(x => x.id === personId);
        if (p) {
            displayName = p.name;
            displayUnit = p.unitId;
        } else if (!name) {
            // Fallback if ID not found and no name provided
            displayName = personId; 
        }
    }
    
    const initials = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const colorClass = displayUnit ? getUnitColor(displayUnit) : 'bg-slate-400 border-slate-300 text-white';
    
    return (
        <div className={`rounded-full ${colorClass} flex items-center justify-center font-bold border shadow-sm shrink-0 ${className}`} title={displayName}>
            {initials}
        </div>
    );
};
