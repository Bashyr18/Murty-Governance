
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Compute } from '../services/compute';
import { Exporter } from '../services/exporter';
import { toast } from '../components/Toasts';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend, ReferenceLine, ScatterChart, Scatter, ZAxis, ComposedChart, Line, ReferenceArea } from 'recharts';
import { ArrowRight, AlertTriangle, Activity, ShieldAlert, Briefcase, Zap, TrendingUp, Printer, FileText, ArrowUpDown, Crosshair, Users, Info, Calendar, X, HelpCircle, ChevronDown, ChevronUp, Lightbulb, User, Layout, Globe, LayoutDashboard, Building2, Monitor, Loader2, Download, Image as ImageIcon, FileType, MoreHorizontal, FileSpreadsheet } from 'lucide-react';
import { Avatar } from '../components/Shared';

const COLORS = {
    safe: 'var(--safe)',
    warn: 'var(--warn)',
    risk: 'var(--risk)',
    accent: 'var(--accent)',
    ink: 'var(--ink)',
    inkDim: 'var(--inkDim)',
    surface2: 'var(--surface2)',
    surface: 'var(--surface)',
    capacityBar: '#94a3b8' 
};

// Helper: Format large numbers (e.g. 5751 -> 5.7k)
const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
};

// --- SUBTLE CHART WRAPPER WITH EXPORT ---
const ChartCard: React.FC<{ 
    title: React.ReactNode, 
    children: React.ReactNode, 
    data?: any[], 
    chartId: string, 
    className?: string 
}> = ({ title, children, data, chartId, className = "" }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPng = async () => {
        setIsMenuOpen(false);
        setIsExporting(true);
        toast("Exporting Chart", "Generating high-res image...", "info");
        await new Promise(resolve => setTimeout(resolve, 200)); // Render wait
        const success = await Exporter.exportToPng(chartId, `${chartId}_${new Date().toISOString().split('T')[0]}.png`);
        setIsExporting(false);
        if(success) toast("Download Ready", "Chart image saved", "success");
        else toast("Export Failed", "Could not generate image", "error");
    };

    const handleExportCsv = () => {
        setIsMenuOpen(false);
        if(!data) {
            toast("No Data", "This chart does not support data export", "warn");
            return;
        }
        Exporter.exportToCsv(data, `${chartId}_data.csv`);
        toast("Download Ready", "Data exported to CSV", "success");
    };

    return (
        <div id={chartId} className={`relative p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm group/chart ${className}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">{title}</div>
                
                {/* Subtle Actions */}
                <div className="relative no-export">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1.5 rounded-lg text-[var(--inkDim)] hover:text-[var(--ink)] hover:bg-[var(--surface2)] opacity-0 group-hover/chart:opacity-100 transition-all"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
                            <button onClick={handleExportPng} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface2)] flex items-center gap-2">
                                <ImageIcon size={14}/> Image
                            </button>
                            <button onClick={handleExportCsv} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface2)] flex items-center gap-2 border-t border-[var(--border)]">
                                <FileSpreadsheet size={14}/> CSV Data
                            </button>
                        </div>
                    )}
                    
                    {isMenuOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    )}
                </div>
            </div>
            {isExporting && (
                <div className="absolute inset-0 bg-[var(--surface)]/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-3xl">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]"/>
                </div>
            )}
            {children}
        </div>
    );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; active?: boolean }> = ({ children, className = "", onClick, active }) => (
  <div onClick={onClick} className={`bg-[var(--card)] border rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${className} ${active ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--inkDim)]'}`}>
    {active && <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent)] opacity-5 rounded-bl-full pointer-events-none"></div>}
    {children}
  </div>
);

// --- EXECUTIVE BRIEFING COMPONENT ---
const ExecutiveBriefing: React.FC<{ 
    user: any, 
    healthScore: number, 
    activeProjects: number, 
    openRisks: number,
    scope: 'global' | 'me',
    setScope: (s: 'global' | 'me') => void
}> = ({ user, healthScore, activeProjects, openRisks, scope, setScope }) => {
    
    const { dispatch, state } = useApp();
    const theme = state.ui.theme;

    // Navigation Helpers
    const navToActive = () => {
        dispatch({ type: 'UPDATE_FILTER', payload: { lifecycleId: 'L-CUR', search: scope === 'me' ? user?.name : '' } });
        dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } });
    };

    const navToRisks = () => {
        dispatch({ type: 'UPDATE_FILTER', payload: { search: scope === 'me' ? user?.name : '' } });
        dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } });
        toast("Risk Focus", "Filtering portfolio by risk items", "info");
    };

    // Determine status color and label
    const statusColor = healthScore >= 80 ? 'var(--safe)' : healthScore >= 60 ? 'var(--warn)' : 'var(--risk)';
    const statusLabel = healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Caution' : 'Critical';

    // Interactive Text Highlight
    const MetricHighlight: React.FC<{ children: React.ReactNode, onClick?: () => void, color?: string, label?: string }> = ({ children, onClick, color, label }) => (
        <span 
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className={`
                group/metric relative inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-all mx-0.5 align-baseline
                ${color ? '' : 'text-[var(--ink)] hover:text-[var(--accent)]'} 
                hover:bg-[var(--surface)] hover:shadow-sm border border-transparent hover:border-[var(--border)]
            `}
            style={{ color: color || undefined }}
        >
            {children}
            {label && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[var(--ink)] text-[var(--bg)] text-[9px] rounded opacity-0 group-hover/metric:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                    {label}
                </span>
            )}
        </span>
    );

    // Dynamic Scope Colors for Theme Compliance
    const scopeStyles = useMemo(() => {
        if (scope === 'global') {
            return {
                containerBorder: 'border-[var(--border)]',
                containerBg: 'bg-[var(--surface)]',
                meshColor: 'var(--accent)',
                gaugeBg: 'bg-[var(--surfaceGlass)]',
                gaugeBorder: 'border-[var(--border)]',
                gaugeTrack: 'text-[var(--surface2)]',
                labelColor: 'text-[var(--inkDim)]',
                textBorder: 'border-[var(--accent)]',
                pillClass: 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
            };
        } else {
            // Personal View
            return {
                containerBorder: 'border-purple-500/30',
                containerBg: 'bg-purple-500/5',
                meshColor: '#a855f7', // Purple-500
                gaugeBg: 'bg-[var(--surfaceGlass)]', // Ensure readable on light mode
                gaugeBorder: 'border-purple-500/30',
                gaugeTrack: 'text-purple-500/10',
                labelColor: 'text-purple-500',
                textBorder: 'border-purple-500',
                pillClass: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/5'
            };
        }
    }, [scope, theme]);

    return (
        <div className={`relative overflow-hidden rounded-3xl border shadow-2xl group isolate transition-all duration-500 ${scopeStyles.containerBorder} ${scopeStyles.containerBg}`}>
            
            {/* Dynamic Backgrounds based on Scope */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {scope === 'global' ? (
                    <>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-5 blur-[120px] z-0"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 mix-blend-overlay"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,purple_0%,transparent_70%)] opacity-[0.07] blur-[100px] z-0"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_60%)] opacity-5 blur-[80px] z-0"></div>
                    </>
                )}
            </div>

            <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="space-y-6 max-w-3xl flex-1">
                    
                    {/* Integrated Scope Switcher */}
                    <div className="inline-flex p-1 bg-[var(--surface2)] border border-[var(--border)] rounded-xl relative no-export shadow-sm">
                        <div 
                            className="absolute top-1 bottom-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                            style={{ 
                                left: scope === 'global' ? '4px' : '50%', 
                                width: 'calc(50% - 4px)' 
                            }}
                        ></div>
                        <button 
                            onClick={() => setScope('global')}
                            className={`relative z-10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors w-[140px] justify-center ${scope === 'global' ? 'text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
                        >
                            <Globe size={14} /> Global
                        </button>
                        <button 
                            onClick={() => setScope('me')}
                            className={`relative z-10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors w-[140px] justify-center ${scope === 'me' ? 'text-[var(--ink)]' : 'text-[var(--inkDim)] hover:text-[var(--ink)]'}`}
                        >
                            <Monitor size={14} /> My View
                        </button>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${scopeStyles.pillClass}`}>
                                {scope === 'global' ? 'Firm Wide Scope' : 'Personal Portfolio Scope'}
                            </span>
                            <span className="text-[var(--inkDim)] text-[10px] font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        
                        <h1 className="font-disp font-black text-4xl sm:text-5xl text-[var(--ink)] tracking-tight leading-[0.9] drop-shadow-sm">
                            {scope === 'global' ? (
                                <>Governance <span className="text-[var(--inkDim)] opacity-50">Briefing</span></>
                            ) : (
                                <>Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ink)] to-[var(--inkDim)]">{user?.name.split(' ')[0]}</span></>
                            )}
                        </h1>
                        
                        <div className={`text-[var(--inkDim)] font-medium text-sm sm:text-base leading-loose border-l-2 pl-4 max-w-2xl ${scopeStyles.textBorder}`}>
                            {scope === 'global' ? (
                                <>
                                    The firm is currently tracking at <MetricHighlight color={statusColor} label="View Health Details">{healthScore}% health</MetricHighlight>. 
                                    There are <MetricHighlight onClick={navToActive} label="Filter Active Projects">{activeProjects} active engagements</MetricHighlight> across the portfolio, 
                                    with <MetricHighlight onClick={navToRisks} color={openRisks > 0 ? 'var(--risk)' : 'var(--safe)'} label="View Risk Register">{openRisks} risks</MetricHighlight> requiring board attention.
                                </>
                            ) : (
                                <>
                                    Your personal portfolio is tracking at <MetricHighlight color={statusColor}>{healthScore}% health</MetricHighlight>. 
                                    You are leading or supporting <MetricHighlight onClick={navToActive}>{activeProjects} active engagements</MetricHighlight> with <MetricHighlight color={openRisks > 0 ? 'var(--risk)' : 'var(--safe)'}>{openRisks} risks</MetricHighlight> assigned to your scope.
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Enhanced Gauge */}
                <div className="flex flex-col-reverse md:flex-col items-end gap-6 w-full md:w-auto self-stretch justify-between">
                    <div className="relative group/gauge w-full md:w-auto mt-auto">
                        <div className={`absolute inset-0 rounded-2xl border shadow-lg transform rotate-0 md:rotate-2 md:group-hover/gauge:rotate-0 transition-transform duration-500 ${scopeStyles.containerBg} ${scopeStyles.containerBorder}`}></div>
                        <div className={`relative backdrop-blur-xl rounded-2xl border p-4 md:p-3 md:pr-6 flex items-center justify-between md:justify-start gap-5 shadow-2xl transition-transform duration-500 md:hover:-translate-y-1 ${scopeStyles.gaugeBg} ${scopeStyles.gaugeBorder}`}>
                            <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <defs>
                                        <linearGradient id={`healthGradient-${scope}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor={statusColor} stopOpacity="0.5" />
                                            <stop offset="100%" stopColor={statusColor} stopOpacity="1" />
                                        </linearGradient>
                                    </defs>
                                    <path className={scopeStyles.gaugeTrack} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth={scope === 'global' ? "3" : "4"} />
                                    <path 
                                        className="transition-all duration-1000 ease-out"
                                        strokeDasharray={`${healthScore}, 100`} 
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                        fill="none" 
                                        stroke={`url(#healthGradient-${scope})`} 
                                        strokeWidth={scope === 'global' ? "3" : "4"} 
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-xl md:text-2xl font-black font-disp text-[var(--ink)]">{healthScore}</span>
                                </div>
                            </div>

                            <div className="flex flex-col text-right md:text-left">
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${scopeStyles.labelColor}`}>
                                    {scope === 'global' ? 'Firm Health' : 'My Health'}
                                </div>
                                <div 
                                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border w-fit ml-auto md:ml-0`}
                                    style={{
                                        backgroundColor: `${statusColor}15`, 
                                        color: statusColor, 
                                        borderColor: `${statusColor}40`
                                    }}
                                >
                                    {statusLabel}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADVANCED TEAM ANALYTICS ---
const TeamCapacityAnalysis: React.FC<{ state: any }> = ({ state }) => {
    const { dispatch } = useApp();

    const data = useMemo(() => {
        const units: Record<string, { id: string, name: string, load: number, capacity: number, headcount: number }> = {};
        
        state.settings.taxonomy.units.forEach((u: any) => {
            units[u.id] = { id: u.id, name: u.id.replace('U-',''), load: 0, capacity: 0, headcount: 0 };
        });

        state.people.forEach((p: any) => {
            if (units[p.unitId]) {
                const score = Compute.calculateWorkloadScore(p, state);
                units[p.unitId].load += score.finalScore;
                units[p.unitId].capacity += score.effectiveCap;
                units[p.unitId].headcount += 1;
            }
        });

        return Object.values(units).map(u => ({
            ...u,
            utilization: u.capacity > 0 ? Math.round((u.load / u.capacity) * 100) : 0,
            avgLoad: u.headcount > 0 ? (u.load / u.headcount).toFixed(1) : 0
        }));
    }, [state]);

    const handleBarClick = (data: any) => {
        if(data && data.activePayload && data.activePayload.length) {
            const unitId = data.activePayload[0].payload.id;
            dispatch({ type: 'UPDATE_FILTER', payload: { unitId } });
            dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } });
            toast("Drill Down", `Filtered portfolio by ${data.activePayload[0].payload.name}`, "info");
        }
    };

    return (
        <ChartCard 
            chartId="team-capacity-chart"
            title={
                <h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2">
                    <Zap size={18} className="text-[var(--accent)]"/> Unit Capacity Load
                </h3>
            }
            data={data}
        >
            <div className="w-full">
                {/* DESKTOP VIEW: Chart */}
                <div className="hidden md:block h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{top: 20, right: 10, bottom: 20, left: 0}} onClick={handleBarClick}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--inkDim)', fontSize: 9, fontWeight: 600, cursor: 'pointer'}} dy={10} />
                            <YAxis 
                                yAxisId="left" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: 'var(--inkDim)', fontSize: 9}} 
                                label={{value: 'Capacity Points', angle: -90, position: 'insideLeft', fill: 'var(--inkDim)', fontSize: 9, offset: 10}} 
                                tickFormatter={formatCompact} 
                            />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: 'var(--accent)', fontSize: 9}} unit="%" domain={[0, 140]} />
                            <RechartsTooltip 
                                contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px 12px'}}
                                itemStyle={{fontSize: '10px', fontWeight: 500, padding: 0}}
                                labelStyle={{color: 'var(--ink)', fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', fontSize: '11px'}}
                                formatter={(value: any, name: string) => [
                                    name === 'Utilization %' ? `${value}% (Load/Cap)` : typeof value === 'number' ? value.toFixed(1) : value,
                                    name
                                ]}
                            />
                            <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                            <Bar yAxisId="left" dataKey="capacity" name="Available Capacity" fill={COLORS.capacityBar} barSize={24} radius={[4,4,0,0]} fillOpacity={0.2} cursor="pointer" />
                            <Bar yAxisId="left" dataKey="load" name="Committed Load" fill="var(--ink)" barSize={24} radius={[4,4,0,0]} cursor="pointer" />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="utilization" 
                                name="Utilization %" 
                                stroke="var(--accent)" 
                                strokeWidth={2} 
                                dot={{r: 3, fill: 'var(--bg)', strokeWidth: 2, stroke: 'var(--accent)'}} 
                                activeDot={{r: 5}}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* MOBILE VIEW: Cards */}
                <div className="md:hidden flex flex-col gap-3">
                    {data.map((u) => {
                        const isOverloaded = u.utilization > 100;
                        const isHigh = u.utilization > 85;
                        const barColor = isOverloaded ? 'var(--risk)' : isHigh ? 'var(--warn)' : 'var(--safe)';
                        
                        return (
                            <div key={u.name} className="p-4 bg-[var(--surface2)] rounded-xl border border-[var(--border)] relative overflow-hidden" 
                                onClick={() => {
                                    dispatch({ type: 'UPDATE_FILTER', payload: { unitId: u.id } });
                                    dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } });
                                }}>
                                {isOverloaded && <div className="absolute top-0 right-0 w-8 h-8 bg-[var(--risk)] opacity-10 rounded-bl-xl"></div>}
                                
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-sm text-[var(--ink)]">{u.name}</div>
                                        <div className="text-[10px] text-[var(--inkDim)] flex items-center gap-1">
                                            <Users size={10} /> {u.headcount} Headcount
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${isOverloaded ? 'bg-[var(--risk)] text-white' : isHigh ? 'bg-[var(--warn)] text-black' : 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)]'}`}>
                                        {u.utilization}%
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-[var(--inkDim)] font-mono uppercase">
                                        <span>Load: {formatCompact(u.load)}</span>
                                        <span>Cap: {formatCompact(u.capacity)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)] relative">
                                        {u.capacity > u.load && (
                                            <div className="absolute top-0 bottom-0 w-px bg-[var(--inkDim)] opacity-50 z-10" style={{ left: '100%' }}></div>
                                        )}
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((u.load / u.capacity) * 100, 100)}%`, backgroundColor: barColor }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCard>
    );
};

// ... existing scatter and dashboard components ...
// (Retaining existing code for scatter and main dashboard layout, only replaced TeamCapacityAnalysis and imports/helpers)

// --- ADVANCED INDIVIDUAL SCATTER ---
const IndividualLoadScatter: React.FC<{ state: any }> = ({ state }) => {
    const { dispatch } = useApp();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const data = useMemo(() => {
        return state.people.map((p: any) => {
            const score = Compute.calculateWorkloadScore(p, state);
            const topRole = Object.entries(score.breakdown.roles).sort((a:any,b:any) => b[1] - a[1])[0];
            return {
                id: p.id,
                name: p.name,
                unit: Compute.unitName(state, p.unitId),
                capacity: score.effectiveCap,
                load: score.finalScore,
                utilization: score.utilizationPct,
                grade: p.grade,
                topRole: topRole ? `${topRole[0]} (${topRole[1].toFixed(1)})` : 'None',
                breakdown: score.breakdown
            };
        }).sort((a,b) => b.utilization - a.utilization);
    }, [state]);

    const redThreshold = state.settings.workload.burnoutConfig.find((c: any) => c.key === 'red_threshold')?.value || 110;
    const amberThreshold = state.settings.workload.burnoutConfig.find((c: any) => c.key === 'amber_threshold')?.value || 90;

    // Mobile View: Top Risk List
    if (isMobile) {
        return (
            <div id="burnout-chart" className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2 mb-6">
                    <Crosshair size={18} className="text-[var(--risk)]"/> Burnout Matrix
                </h3>
                <div className="flex flex-col gap-3 h-[350px] overflow-y-auto custom-scrollbar">
                    {data.slice(0, 8).map((d, i) => (
                        <div key={d.id} onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: d.id }})} className="flex items-center gap-3 p-3 bg-[var(--surface2)] rounded-xl border border-transparent hover:border-[var(--accent)] transition-all active:scale-95">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 ${d.utilization > redThreshold ? 'bg-[var(--risk)]' : d.utilization > amberThreshold ? 'bg-[var(--warn)] text-black' : 'bg-[var(--safe)]'}`}>
                                {d.utilization.toFixed(0)}%
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-[var(--ink)] truncate">{d.name}</div>
                                <div className="text-[10px] text-[var(--inkDim)] truncate">{d.grade} • {d.unit}</div>
                            </div>
                            <ChevronDown size={14} className="-rotate-90 text-[var(--inkDim)]"/>
                        </div>
                    ))}
                    <div className="text-center text-[10px] text-[var(--inkDim)] pt-2 italic">Showing top 8 busiest</div>
                </div>
            </div>
        );
    }

    return (
        <ChartCard 
            chartId="burnout-chart"
            title={
                <h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2">
                    <Crosshair size={18} className="text-[var(--risk)]"/> Burnout Matrix
                </h3>
            }
            data={data}
        >
            <div className="h-[350px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 10}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                        <XAxis type="number" dataKey="load" name="Load (Points)" unit=" pts" axisLine={{stroke: 'var(--border2)'}} tickLine={false} tick={{fill: 'var(--inkDim)', fontSize: 10}} label={{value: 'Workload Score (Points)', position: 'insideBottom', offset: -10, fill: 'var(--inkDim)', fontSize: 10}} />
                        <YAxis type="number" dataKey="utilization" name="Utilization" unit="%" axisLine={{stroke: 'var(--border2)'}} tickLine={false} tick={{fill: 'var(--inkDim)', fontSize: 10}} label={{value: 'Utilization %', angle: -90, position: 'insideLeft', fill: 'var(--inkDim)', fontSize: 10}} domain={[0, 160]} />
                        <ZAxis range={[60, 60]} />
                        <ReferenceArea y1={redThreshold} y2={160} fill="var(--risk)" fillOpacity={0.05} stroke="none" />
                        <ReferenceArea y1={amberThreshold} y2={redThreshold} fill="var(--warn)" fillOpacity={0.05} stroke="none" />
                        <ReferenceLine y={100} stroke="var(--inkDim)" strokeDasharray="3 3" strokeOpacity={0.5} label={{value: "Target Cap (100%)", position: "insideTopLeft", fontSize: 10, fill: "var(--inkDim)", fontWeight: 'bold'}} />
                        <ReferenceLine y={redThreshold} stroke="var(--risk)" strokeOpacity={0.4} label={{value: "Burnout Zone", position: "insideTopRight", fontSize: 10, fill: "var(--risk)", fontWeight: 'bold'}} />
                        <RechartsTooltip 
                            cursor={{strokeDasharray: '3 3'}}
                            wrapperStyle={{ zIndex: 100 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl shadow-xl z-50 min-w-[260px] max-w-[320px]">
                                            <div className="flex flex-col mb-3 border-b border-[var(--border2)] pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-bold text-sm text-[var(--ink)] break-words leading-tight mr-2">{d.name}</div>
                                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${d.utilization > redThreshold ? 'bg-[var(--risk)] text-white' : 'bg-[var(--surface2)] text-[var(--inkDim)]'}`}>
                                                        {d.grade}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-[var(--inkDim)] font-mono uppercase mt-1">{d.unit}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <div className="text-[10px] text-[var(--inkDim)] uppercase mb-0.5">Utilization</div>
                                                    <div className={`text-xl font-black ${d.utilization > redThreshold ? 'text-[var(--risk)]' : 'text-[var(--ink)]'}`}>{d.utilization.toFixed(0)}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-[var(--inkDim)] uppercase mb-0.5">Capacity</div>
                                                    <div className="text-xl font-black text-[var(--ink)]">{d.capacity.toFixed(1)}</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-[var(--inkDim)] italic text-right mt-1">Click to view profile</div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="People" data={data} onClick={(d:any) => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: d.id }})} cursor="pointer">
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.utilization > redThreshold ? 'var(--risk)' : entry.utilization > amberThreshold ? 'var(--warn)' : 'var(--safe)'} stroke={entry.utilization > redThreshold ? 'var(--bg)' : 'transparent'} strokeWidth={entry.utilization > redThreshold ? 2 : 0} className="hover:opacity-80 transition-opacity"/>
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
};

// --- REAL WORKLOAD PROJECTION ENGINE ---
const CapacityForecast: React.FC<{ state: any }> = ({ state }) => {
    const { dispatch } = useApp();
    
    // Calculate Forecast based on ACTUAL project dates (no randomization)
    const { forecast, topPeople, summary } = useMemo(() => {
        // 1. Setup Time Horizon (Next 6 Months)
        const months: any[] = [];
        const today = new Date();
        
        for (let i = 0; i < 6; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0); // Last day of month
            
            months.push({ 
                name: d.toLocaleString('default', { month: 'short' }), 
                fullDate: d,
                start: monthStart.getTime(), 
                end: monthEnd.getTime()
            });
        }

        // 2. Identify Top 5 Busiest People (Current Load as baseline)
        const allPeopleScores = state.people.map((p: any) => ({
            person: p,
            score: Compute.calculateWorkloadScore(p, state)
        })).sort((a: any, b: any) => b.score.utilizationPct - a.score.utilizationPct);
        
        const topPeople = allPeopleScores.slice(0, 5).map((x: any) => x.person);

        // 3. Project Load for Each Month
        let peakLoad = 0;
        let peakMonth = "";
        let busiestPersonName = "";

        const forecastData = months.map(m => {
            const dataPoint: any = { name: m.name };
            
            topPeople.forEach((p: any) => {
                // Calculate projected score for this specific month
                let monthlyScore = 0;
                
                // Identify which projects are active in this month window
                const activeInWindow = state.workItems.filter((w: any) => {
                    const staffing = w.staffing.find((s: any) => s.personId === p.id);
                    if (!staffing) return false;
                    
                    const start = w.startDate ? new Date(w.startDate).getTime() : 0;
                    const end = w.endDate ? new Date(w.endDate).getTime() : 0;
                    if (!start && !end) return true;
                    return (start <= m.end && end >= m.start);
                });

                activeInWindow.forEach((w: any) => {
                    const assignment = w.staffing.find((s: any) => s.personId === p.id);
                    const phaseName = state.settings.taxonomy.lifecycle.find((l: any) => l.id === w.lifecycleId)?.name || "";
                    const stageMult = state.settings.workload.stageMultipliers.find((s: any) => s.stage === phaseName)?.multiplier || 0.5;
                    const roleWeight = state.settings.workload.roleWeights.find((r: any) => r.role === assignment.roleKey)?.weight || 1.0;
                    const compFactor = state.settings.workload.complexityFactors.find((c: any) => c.level === (w.complexity || 3))?.factor || 1.0;
                    const allocFactor = (assignment.allocation || 50) / 100;
                    monthlyScore += (stageMult * roleWeight * compFactor * allocFactor);
                });

                const currentScoreObj = allPeopleScores.find((x: any) => x.person.id === p.id)?.score;
                const cap = currentScoreObj?.effectiveCap || 10;
                const util = (monthlyScore / cap) * 100;

                dataPoint[p.code] = util;
                if (util > peakLoad) {
                    peakLoad = util;
                    peakMonth = m.name;
                    busiestPersonName = p.name;
                }
            });
            return dataPoint;
        });

        const summary = peakLoad > 100 
            ? `Peak strain detected in ${peakMonth}, driven by ${busiestPersonName} reaching ${peakLoad.toFixed(0)}% utilization.`
            : "Workload is projected to remain within sustainable limits over the next 6 months.";

        return { forecast: forecastData, topPeople, summary };
    }, [state]);

    const keys = topPeople.map((p:any) => p.code);
    const colorPalette = ['#0F766E', '#059669', '#D97706', '#B91C1C', '#4F46E5'];
    const getUtilColor = (u: number) => u > 110 ? 'var(--risk)' : u > 90 ? 'var(--warn)' : 'var(--safe)';
    const getPrimaryDriver = (personId: string) => {
        const myItems = state.workItems.filter(w => w.staffing.some(s => s.personId === personId));
        const sorted = myItems.sort((a,b) => (b.complexity||0) - (a.complexity||0));
        return sorted.length > 0 ? sorted[0].name : "None";
    };

    return (
        <ChartCard 
            chartId="forecast-chart"
            title={
                <div>
                    <h3 className="font-bold text-lg text-[var(--ink)] flex items-center gap-2">
                        <TrendingUp size={18} className="text-[var(--safe)]"/> 6-Month Capacity Horizon
                    </h3>
                    <p className="text-xs text-[var(--inkDim)] ml-7">Projected cumulative utilization for critical resources.</p>
                </div>
            }
            data={forecast}
        >
            <div className="flex flex-col gap-5">
                <div className="bg-[var(--surface2)]/50 border border-[var(--border)] rounded-xl p-3 flex items-start gap-3">
                    <div className="p-2 bg-[var(--surface)] rounded-lg text-[var(--accent)] border border-[var(--border)] shrink-0">
                        <Lightbulb size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[var(--ink)] uppercase tracking-wide mb-0.5">Forecast Insight</div>
                        <div className="text-xs text-[var(--inkDim)] leading-relaxed">{summary}</div>
                    </div>
                </div>

                <div className="h-[280px] w-full mt-2 relative overflow-x-auto overflow-y-hidden">
                    <div className="h-full min-w-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    {keys.map((key: string, i: number) => (
                                        <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colorPalette[i % colorPalette.length]} stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor={colorPalette[i % colorPalette.length]} stopOpacity={0}/>
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--inkDim)'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--inkDim)'}} domain={[0, 'auto']} />
                                <ReferenceLine y={100} stroke="var(--inkDim)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '100% Cap', position: 'insideTopRight', fill: 'var(--inkDim)', fontSize: 9 }} />
                                <ReferenceArea y1={100} y2={200} fill="var(--risk)" fillOpacity={0.03} />
                                <RechartsTooltip 
                                    contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                    itemStyle={{fontSize: '11px', fontWeight: 500}}
                                    labelStyle={{color: 'var(--ink)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px'}}
                                    formatter={(value: number) => [`${value.toFixed(0)}% Utilization`, '']}
                                />
                                {keys.map((key: string, i: number) => (
                                    <Area key={key} type="monotone" dataKey={key} stroke={colorPalette[i % colorPalette.length]} fillOpacity={1} fill={`url(#color${key})`} strokeWidth={2} stackId="1" />
                                ))}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="flex flex-col pt-4 border-t border-[var(--border2)] gap-2">
                    <div className="hidden md:flex justify-between text-[10px] uppercase font-bold text-[var(--inkDim)] mb-1 px-4">
                        <span className="w-[40%]">Resource Profile</span>
                        <span className="w-[40%]">Primary Driver</span>
                        <span className="w-[20%] text-right">Load Utilization</span>
                    </div>
                    {topPeople.map((p: any, i: number) => {
                        const score = Compute.calculateWorkloadScore(p, state);
                        const util = score.utilizationPct;
                        const utilColor = getUtilColor(util);
                        const driver = getPrimaryDriver(p.id);
                        return (
                            <div key={p.id} onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'person', personId: p.id }})} className="group cursor-pointer">
                                {/* Desktop Row */}
                                <div className="hidden md:flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface2)] border border-transparent hover:border-[var(--border)] transition-all">
                                    <div className="flex items-center gap-3 w-[40%]">
                                        <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ color: colorPalette[i % colorPalette.length] }}>
                                            {p.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors">{p.name}</div>
                                            <div className="text-[10px] text-[var(--inkDim)] truncate">{p.title}</div>
                                        </div>
                                    </div>
                                    <div className="w-[40%] px-2">
                                        <div className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] pl-2 pr-3 py-1 rounded-full max-w-full">
                                            <Briefcase size={10} className="text-[var(--inkDim)] shrink-0" />
                                            <span className="text-[10px] font-medium text-[var(--ink)] truncate">{driver}</span>
                                        </div>
                                    </div>
                                    <div className="w-[20%] flex flex-col items-end gap-1">
                                        <span className="text-xs font-mono font-bold" style={{ color: utilColor }}>{util.toFixed(0)}%</span>
                                        <div className="w-24 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(util, 100)}%`, backgroundColor: utilColor }}></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Mobile Card */}
                                <div className="md:hidden flex flex-col p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] gap-3 active:scale-[0.98] transition-transform">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={p.name} unitId={p.unitId} className="w-10 h-10" />
                                            <div>
                                                <div className="font-bold text-sm text-[var(--ink)]">{p.name}</div>
                                                <div className="text-[10px] text-[var(--inkDim)]">{p.grade}</div>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border ${util > 100 ? 'bg-[var(--risk)] text-white border-[var(--risk)]' : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)]'}`}>
                                            {util.toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]">
                                        <Activity size={12} className="text-[var(--accent)] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] text-[var(--inkDim)] uppercase font-bold tracking-wider">Primary Driver</div>
                                            <div className="text-[11px] font-medium text-[var(--ink)] truncate">{driver}</div>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${Math.min(util, 100)}%`, backgroundColor: utilColor }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCard>
    );
};

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useApp();
  const { currentUser } = state.ui;
  const user = state.people.find(p => p.id === currentUser);
  const [viewScope, setViewScope] = useState<'global' | 'me'>('global');
  const [isExportingGlobal, setIsExportingGlobal] = useState(false);

  // Compute summary metrics based on Scope
  const metrics = useMemo(() => {
      let projects = state.workItems;
      if (viewScope === 'me' && currentUser) {
          projects = projects.filter(w => w.staffing.some(s => s.personId === currentUser));
      }
      const totalProjects = projects.length;
      const activeProjects = projects.filter(w => w.lifecycleId === 'L-CUR').length;
      const finalHealth = Compute.healthScore(state, projects);
      const openRisks = Compute.criticalRiskCount(state, projects);

      return {
          totalProjects,
          activeProjects,
          healthScore: finalHealth,
          openRisks,
          freshReports: projects.filter(w => {
              const age = Compute.reportAgeDays(state, w.id);
              return age !== null && age <= 7;
          }).length
      };
  }, [state, viewScope, currentUser]);
  
  const handleGlobalExport = async () => {
      setIsExportingGlobal(true);
      toast("Generating Report", "Creating landscape dashboard PDF...", "info");
      // Short delay to allow UI to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = await Exporter.exportToPdf('dashboard-view', `Governance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExportingGlobal(false);
      if(success) toast("Export Complete", "Dashboard PDF downloaded", "success");
      else toast("Export Failed", "Could not generate file", "error");
  };

  const goPortfolio = () => {
      dispatch({ type: 'UPDATE_FILTER', payload: { search: viewScope === 'me' && user ? user.name : '' } });
      dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } });
  };
  
  const goPeople = () => dispatch({ type: 'SET_VIEW', payload: { view: 'people' } });

  return (
    <div id="dashboard-view" className="dashboard-container max-w-[1600px] mx-auto flex flex-col gap-6 lg:gap-8 pb-10 animate-fade-in p-4 bg-[var(--bg)] relative">
        
        {/* Subtle Global Export Action */}
        <div className="absolute top-4 right-4 z-20 no-export">
            <button 
                onClick={handleGlobalExport}
                disabled={isExportingGlobal}
                className="p-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--inkDim)] hover:text-[var(--accent)] hover:border-[var(--accent)] shadow-sm transition-all"
                title="Export Dashboard PDF (Landscape)"
            >
                {isExportingGlobal ? <Loader2 size={16} className="animate-spin"/> : <Printer size={16} />}
            </button>
        </div>

        {/* EXECUTIVE BRIEFING & WELCOME */}
        <ExecutiveBriefing 
            user={user} 
            healthScore={metrics.healthScore} 
            activeProjects={metrics.activeProjects} 
            openRisks={metrics.openRisks} 
            scope={viewScope}
            setScope={setViewScope}
        />

        {/* METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card onClick={goPortfolio} active className="cursor-pointer hover:border-[var(--accent)] group">
                <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div className="p-1.5 lg:p-2 bg-[var(--surface2)] rounded-lg text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-[var(--bg)] transition-colors"><Briefcase className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]" /></div>
                    <ArrowRight size={16} className="text-[var(--inkDim)] -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-disp text-[var(--ink)] mb-1">{metrics.totalProjects}</div>
                <div className="text-[10px] lg:text-xs font-bold uppercase text-[var(--inkDim)] tracking-wider">{viewScope === 'global' ? 'Total Engagements' : 'My Engagements'}</div>
            </Card>

            <Card className="cursor-pointer hover:border-[var(--risk)] group" onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: 'portfolio' } })}>
                <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div className="p-1.5 lg:p-2 bg-[rgba(255,59,59,0.1)] rounded-lg text-[var(--risk)] group-hover:bg-[var(--risk)] group-hover:text-white transition-colors"><ShieldAlert className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]" /></div>
                    <div className="px-2 py-0.5 bg-[var(--risk)] text-white text-[9px] font-bold rounded-full">{metrics.openRisks} Critical</div>
                </div>
                <div className="text-2xl lg:text-3xl font-black font-disp text-[var(--ink)] mb-1">{metrics.healthScore}%</div>
                <div className="text-[10px] lg:text-xs font-bold uppercase text-[var(--inkDim)] tracking-wider">{viewScope === 'global' ? 'System Health' : 'My Portfolio Health'}</div>
            </Card>

            <Card onClick={goPeople} className="cursor-pointer hover:border-[var(--safe)] group">
                <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div className="p-1.5 lg:p-2 bg-[var(--surface2)] rounded-lg text-[var(--safe)] group-hover:bg-[var(--safe)] group-hover:text-white transition-colors"><Users className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]" /></div>
                    <ArrowRight size={16} className="text-[var(--inkDim)] -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
                <div className="text-2xl lg:text-3xl font-black font-disp text-[var(--ink)] mb-1">{state.people.length}</div>
                <div className="text-[10px] lg:text-xs font-bold uppercase text-[var(--inkDim)] tracking-wider">Total Headcount</div>
            </Card>

            <Card className="hover:border-[var(--accent)] group">
                 <div className="flex justify-between items-start mb-3 lg:mb-4">
                    <div className="p-1.5 lg:p-2 bg-[var(--surface2)] rounded-lg text-[var(--warn)] group-hover:bg-[var(--warn)] group-hover:text-black transition-colors"><Activity className="w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]" /></div>
                </div>
                <div className="text-2xl lg:text-3xl font-black font-disp text-[var(--ink)] mb-1">
                    {metrics.freshReports}
                </div>
                <div className="text-[10px] lg:text-xs font-bold uppercase text-[var(--inkDim)] tracking-wider">{viewScope === 'global' ? 'Reports This Week' : 'My Reports Filed'}</div>
            </Card>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamCapacityAnalysis state={state} />
            <IndividualLoadScatter state={state} />
        </div>

        {/* CHARTS ROW 2 - FORECAST */}
        <CapacityForecast state={state} />
    </div>
  );
};
