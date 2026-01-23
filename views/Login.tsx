
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from '../components/Toasts';
import { Compute } from '../services/compute';
import { ArrowRight, ShieldCheck, SunMoon, User, Key, Eye, EyeOff, LayoutGrid, Command, ChevronRight, Activity, Zap, TrendingUp, Layers, AlertTriangle, Hexagon } from 'lucide-react';

// Quick Access Personas for Demo
const DEMO_USERS = [
    { id: 'MP', name: 'Abdul Oladapo', role: 'Managing Partner', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'TA-SM', name: 'Sesan Adedapo', role: 'Unit Head (TA)', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'GG-AN', name: 'Islamiat Oseni', role: 'Analyst', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
];

export const Login: React.FC = () => {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Compute Real System Stats for the Login Screen
  const healthScore = useMemo(() => Compute.healthScore(state), [state]);
  
  // Logic Fix: Active Projects should exclude expired items and include committed proposals
  const activeProjects = useMemo(() => {
      const now = new Date();
      return state.workItems.filter(w => {
          // Include Current Engagements that haven't ended
          if (w.lifecycleId === 'L-CUR') {
              if (w.endDate && new Date(w.endDate) < now) return false;
              return true;
          }
          // Include Live Proposals (Active Pursuit)
          if (w.lifecycleId === 'L-PRO') return true;
          
          return false;
      }).length;
  }, [state]);

  const criticalRisks = useMemo(() => Compute.criticalRiskCount(state), [state]);

  const trend = healthScore > 80 ? '+2.4%' : healthScore > 60 ? '-1.2%' : '-5.8%';
  const trendColor = healthScore > 80 ? 'text-[var(--safe)]' : healthScore > 60 ? 'text-[var(--warn)]' : 'text-[var(--risk)]';

  const toggleTheme = () => {
    const next = state.ui.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: next });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const user = state.people.find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (user && (user.id === password || password === 'admin')) {
      dispatch({ type: 'LOGIN', payload: user.id });
      toast("Authentication Successful", `Welcome back, ${user.name.split(' ')[0]}`, "success");
    } else {
      setError("Access Denied: Invalid credentials.");
      setLoading(false);
    }
  };

  const fillDemo = (u: typeof DEMO_USERS[0]) => {
      setName(u.name);
      setPassword(u.id);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] text-[var(--ink)] overflow-hidden transition-colors duration-500 font-sans selection:bg-[var(--accent)] selection:text-[var(--bg)]">
        
        {/* LEFT PANEL: IMMERSIVE VISUALS (Desktop Only) */}
        <div className="hidden lg:flex w-[60%] relative bg-[var(--surface)] items-center justify-center overflow-hidden">
            
            {/* Abstract Governance Grid Texture */}
            <div className="absolute inset-0 opacity-[0.03]" 
                style={{ 
                    backgroundImage: `
                        linear-gradient(var(--ink) 1px, transparent 1px), 
                        linear-gradient(90deg, var(--ink) 1px, transparent 1px)
                    `, 
                    backgroundSize: '60px 60px'
                }}
            ></div>
            
            {/* Dynamic Light Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent)] opacity-[0.05] blur-[150px] animate-pulse rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--risk)] opacity-[0.03] blur-[120px] animate-pulse rounded-full" style={{ animationDelay: '2s' }}></div>

            {/* The "HUD" Card */}
            <div className="relative z-10 w-[420px] backdrop-blur-3xl bg-[var(--surfaceGlass)] border border-[var(--border)] rounded-[32px] p-8 shadow-2xl animate-slide-up hover:scale-[1.01] transition-transform duration-700">
                {/* Glossy Reflection */}
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)] relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accentDim)] text-[var(--bg)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
                            <Hexagon size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="font-disp font-black text-xl tracking-tight leading-none">Murty<span className="opacity-50">Gov</span></div>
                            <div className="text-[10px] font-mono text-[var(--inkDim)] uppercase tracking-widest mt-1.5">System v1.10</div>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk)] animate-pulse"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--safe)]"></span>
                    </div>
                </div>
                
                <div className="space-y-8 relative">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-[var(--inkDim)] uppercase tracking-wide flex items-center gap-2">
                                <ShieldCheck size={12} className="text-[var(--accent)]" /> 
                                Global Governance Index
                            </div>
                            <div className="text-5xl font-black font-disp tracking-tighter text-[var(--ink)] drop-shadow-sm">{healthScore}%</div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full border bg-[var(--surface)] border-[var(--border)] flex items-center gap-2 shadow-sm`}>
                            <TrendingUp size={14} className={trendColor} />
                            <span className="text-xs font-bold font-mono text-[var(--ink)]">{trend}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--surface2)]/50 border border-[var(--border)] rounded-2xl backdrop-blur-sm">
                            <div className="text-[10px] text-[var(--inkDim)] uppercase font-bold mb-2 flex items-center gap-1.5">
                                <Layers size={12} /> Global Active Scope
                            </div>
                            <div className="font-disp font-bold text-2xl text-[var(--ink)]">{activeProjects}</div>
                        </div>
                        <div className="p-4 bg-[var(--surface2)]/50 border border-[var(--border)] rounded-2xl backdrop-blur-sm">
                            <div className="text-[10px] text-[var(--inkDim)] uppercase font-bold mb-2 flex items-center gap-1.5">
                                <AlertTriangle size={12} className="text-[var(--risk)]" /> Critical Risks
                            </div>
                            <div className="font-disp font-bold text-2xl text-[var(--ink)]">{criticalRisks}</div>
                        </div>
                    </div>

                    {/* Decorative Data Bars */}
                    <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[9px] font-mono text-[var(--inkDim)] uppercase">
                            <span>System Load</span>
                            <span>Optimal</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] w-[75%] rounded-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] text-[var(--inkDim)] font-mono uppercase tracking-[0.2em] opacity-60">
                    Executive Portfolio Intelligence
                </p>
            </div>
        </div>

        {/* RIGHT PANEL: LOGIN FORM (Modernized) */}
        <div className="w-full lg:w-[40%] flex flex-col relative bg-[var(--bg)] border-l border-[var(--border)] shadow-2xl shadow-[var(--bg)] z-20">
            
            {/* Top Bar */}
            <div className="p-6 flex justify-between items-center absolute top-0 left-0 right-0 z-10">
                <div className="lg:hidden flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center font-black text-lg">M</div>
                    <span className="font-disp font-bold text-lg">Murty</span>
                </div>
                <div className="hidden lg:block"></div>
                <button 
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--inkDim)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] transition-all"
                >
                    <SunMoon size={18} />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 xl:px-24">
                <div className="max-w-md w-full mx-auto space-y-10">
                    
                    <div className="space-y-2 animate-slide-up">
                        <h1 className="font-disp font-black text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">Welcome Back</h1>
                        <p className="text-[var(--inkDim)] text-sm font-medium">Enter your credentials to access the cockpit.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        
                        <div className={`group relative bg-[var(--surface)] border rounded-xl transition-all duration-300 ${focusedField === 'name' ? 'border-[var(--accent)] ring-4 ring-[var(--accentDim)]' : 'border-[var(--border)] hover:border-[var(--inkDim)]'}`}>
                            <div className="absolute left-4 top-3.5 text-[var(--inkDim)] group-focus-within:text-[var(--accent)] transition-colors">
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent p-3.5 pl-12 text-sm font-bold text-[var(--ink)] outline-none placeholder:text-[var(--inkDim)]/50"
                                placeholder="Full Name"
                                autoComplete="off"
                            />
                        </div>

                        <div className={`group relative bg-[var(--surface)] border rounded-xl transition-all duration-300 ${focusedField === 'password' ? 'border-[var(--accent)] ring-4 ring-[var(--accentDim)]' : 'border-[var(--border)] hover:border-[var(--inkDim)]'}`}>
                            <div className="absolute left-4 top-3.5 text-[var(--inkDim)] group-focus-within:text-[var(--accent)] transition-colors">
                                <Key size={18} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-transparent p-3.5 pl-12 pr-12 text-sm font-bold text-[var(--ink)] outline-none placeholder:text-[var(--inkDim)]/50 font-mono"
                                placeholder="Access ID"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-[var(--inkDim)] hover:text-[var(--ink)] transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 bg-[var(--risk)]/10 border border-[var(--risk)]/20 rounded-lg flex items-center gap-2 text-[var(--risk)] text-xs font-bold animate-shake">
                                <ShieldCheck size={14} /> {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || !name}
                            className="w-full py-4 rounded-xl bg-[var(--ink)] text-[var(--bg)] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {loading ? (
                                <Activity className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <span className="relative z-10">Sign In</span>
                                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </form>

                    <div className="pt-8 border-t border-[var(--border)] animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="text-[10px] font-bold uppercase text-[var(--inkDim)] tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={12} className="text-[var(--accent)]" /> Quick Access
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {DEMO_USERS.map(u => (
                                <button 
                                    key={u.id} 
                                    onClick={() => fillDemo(u)}
                                    className={`
                                        group flex flex-col items-start p-3 rounded-xl border transition-all text-left relative overflow-hidden
                                        ${u.bg} ${u.border} hover:border-opacity-100 border-opacity-50 hover:shadow-md active:scale-95
                                    `}
                                >
                                    <span className={`text-[10px] font-bold uppercase mb-1 opacity-80 ${u.color}`}>{u.role}</span>
                                    <span className="text-xs font-bold text-[var(--ink)] truncate w-full">{u.name}</span>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2">
                                        <ChevronRight size={14} className={u.color} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-6 text-center text-[10px] font-mono text-[var(--inkDim)] border-t border-[var(--border)] opacity-60">
                Murty Governance System • Encrypted • v1.10
            </div>
        </div>
    </div>
  );
};
