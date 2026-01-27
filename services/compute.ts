
import { AppState, WorkItem, Person, Report, RaidItem, AccessLevel, WorkloadScore, WorkloadSettings, StaffingEntry } from '../types';

export const Compute = {
  // Cache for workload scores to prevent redundant math during a single render pass
  _scoreCache: new Map<string, WorkloadScore>(),

  // --- Taxonomy Helpers ---
  unitName(state: AppState, unitId: string) {
    const u = state.settings.taxonomy.units.find(u => u.id === unitId);
    return u ? u.name : (unitId || 'Unknown Unit');
  },
  lifecycleName(state: AppState, lid: string) {
    const l = state.settings.taxonomy.lifecycle.find(l => l.id === lid);
    return l ? l.name : (lid || 'Unknown Phase');
  },
  typeName(state: AppState, tid: string) {
    const t = state.settings.taxonomy.workTypes.find(t => t.id === tid);
    return t ? t.name : (tid || 'Unknown Type');
  },
  
  // --- People Helpers ---
  person(state: AppState, pid: string | null) {
    if (!pid) return null;
    return state.people.find(p => p.id === pid) || null;
  },
  staffLabel(state: AppState, staffEntry: any) {
    if (staffEntry.personId) {
      const p = this.person(state, staffEntry.personId);
      return p ? p.name : staffEntry.personId;
    }
    return staffEntry.externalName ? `[EXT] ${staffEntry.externalName}` : "(Unassigned)";
  },
  
  // --- Reporting Helpers ---
  lastReport(state: AppState, workId: string): Report | null {
    const pack = state.packs[workId];
    if (!pack || !pack.reports || !pack.reports.length) return null;
    return pack.reports[0]; 
  },
  reportAgeDays(state: AppState, workId: string): number | null {
    const r = this.lastReport(state, workId);
    if (!r) return null;
    const ms = Date.now() - new Date(r.ts).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  },

  // --- RAID Helpers ---
  openRiskCount(state: AppState, subset?: WorkItem[]) {
    let c = 0;
    const items = subset || state.workItems;
    for (const wi of items) {
      const pack = state.packs[wi.id];
      if (pack?.raid) {
          c += pack.raid.filter(r => r.type === "Risk" && r.status !== "Closed").length;
      }
    }
    return c;
  },
  criticalRiskCount(state: AppState, subset?: WorkItem[]) {
    let c = 0;
    const items = subset || state.workItems;
    for (const wi of items) {
      const pack = state.packs[wi.id];
      if (pack?.raid) {
          c += pack.raid.filter(r => r.type === "Risk" && r.impact === "High" && r.status !== "Closed").length;
      }
    }
    return c;
  },

  // --- Search Depth Extension ---
  searchMatchesWork(state: AppState, w: WorkItem, term: string): boolean {
    const t = term.toLowerCase();
    // Basic fields
    if (w.name.toLowerCase().includes(t) || w.id.toLowerCase().includes(t) || w.description.toLowerCase().includes(t)) return true;
    
    // RAID content search (Audit Finding: Blindspot)
    const pack = state.packs[w.id];
    if (pack?.raid?.some(r => r.title.toLowerCase().includes(t) || r.description.toLowerCase().includes(t))) return true;

    // Staff names
    if (w.staffing.some(s => {
      if (s.personId) {
        const p = state.people.find(x => x.id === s.personId);
        return p && p.name.toLowerCase().includes(t);
      }
      return s.externalName?.toLowerCase().includes(t);
    })) return true;

    return false;
  },

  // --- WORKLOAD ENGINE ---
  calculateAssignmentLoad(
      assignment: StaffingEntry, 
      workItem: WorkItem, 
      settings: WorkloadSettings
  ): { points: number, isCommitted: boolean, roleCategory: string } {
      const stageSetting = settings.stageMultipliers.find((s: any) => s.lifecycleId === workItem.lifecycleId);
      const stageMult = stageSetting ? stageSetting.multiplier : 0.3;
      const isCommitted = stageSetting ? stageSetting.isCommitted : false;

      const roleSetting = settings.roleWeights.find((r: any) => r.role === assignment.roleKey);
      const roleWeight = roleSetting ? roleSetting.weight : 1.0;
      const roleCategory = roleSetting ? roleSetting.category : 'Execution';

      const compSetting = settings.complexityFactors.find((c: any) => c.level === (workItem.complexity || 3));
      const compFactor = compSetting ? compSetting.factor : 1.0;

      let allocPct = assignment.allocation;
      if (allocPct === undefined) {
          const defAlloc = settings.defaultAllocations.find((d: any) => d.role === assignment.roleKey);
          allocPct = defAlloc ? defAlloc.percent : 50;
      }
      
      const points = stageMult * roleWeight * compFactor * (allocPct / 100);
      return { points, isCommitted, roleCategory };
  },

  calculateWorkloadScore(person: Person, state: AppState): WorkloadScore {
    const cacheKey = `${person.id}-${state.meta.updatedAt}`;
    if (this._scoreCache.has(cacheKey)) return this._scoreCache.get(cacheKey)!;

    const settings = state.settings.workload;
    const gradeCap = settings.gradeCapacities.find(g => g.grade === person.grade) || settings.gradeCapacities[0];
    const mod = person.profile.capacityModifier !== undefined ? person.profile.capacityModifier : 10;
    const effectiveCap = gradeCap.weeklyPoints * (mod / 10);

    let committedLoad = 0, pipelineLoad = 0, committedItems = 0, totalItems = 0;
    const rolePoints: Record<string, number> = { Oversight: 0, DeliveryLead: 0, Execution: 0, PeopleManagement: 0 };

    state.workItems.forEach(wi => {
        const assignment = wi.staffing.find(s => s.personId === person.id);
        if(!assignment) return;
        const res = this.calculateAssignmentLoad(assignment, wi, settings);
        if(res.isCommitted) { committedLoad += res.points; committedItems++; }
        else { pipelineLoad += res.points; }
        totalItems++;
        rolePoints[res.roleCategory] = (rolePoints[res.roleCategory] || 0) + res.points;
    });

    const penCurrent = settings.burnoutConfig.find(c => c.key === 'penalty_per_extra_current_item')?.value || 0;
    const penTotal = settings.burnoutConfig.find(c => c.key === 'penalty_per_extra_total_item')?.value || 0;
    
    let penaltyPoints = 0;
    if (committedItems > gradeCap.maxCurrent) penaltyPoints += (committedItems - gradeCap.maxCurrent) * penCurrent;
    if (totalItems > gradeCap.maxTotal) penaltyPoints += (totalItems - gradeCap.maxTotal) * penTotal;

    const reports = state.people.filter(p => p.formalManagerId === person.id).length;
    const penMgmt = settings.burnoutConfig.find(c => c.key === 'per_direct_report_weight')?.value || 0;
    const mgmtLoad = reports * penMgmt;

    const finalScore = committedLoad + pipelineLoad + penaltyPoints + mgmtLoad;
    const utilPct = effectiveCap > 0 ? (finalScore / effectiveCap) * 100 : 0;

    const amberThresh = settings.burnoutConfig.find(c => c.key === 'amber_threshold')?.value || 100;
    const redThresh = settings.burnoutConfig.find(c => c.key === 'red_threshold')?.value || 120;

    const score = {
        personId: person.id, gradeCapBase: gradeCap.weeklyPoints, effectiveCap, committedLoad,
        pipelineLoad, totalLoad: committedLoad + pipelineLoad, penaltyPoints, mgmtLoad, finalScore,
        utilizationPct: utilPct, risk: (utilPct >= redThresh ? 'Red' : utilPct >= amberThresh ? 'Amber' : 'Green') as any,
        breakdown: { items: totalItems, committedItems, concurrencyPenalty: penaltyPoints, roles: rolePoints }
    };
    
    this._scoreCache.set(cacheKey, score);
    return score;
  },

  calculateAllWorkloadScores(state: AppState): Record<string, WorkloadScore> {
      this._scoreCache.clear();
      const scores: Record<string, WorkloadScore> = {};
      state.people.forEach(p => { scores[p.id] = this.calculateWorkloadScore(p, state); });
      return scores;
  },

  checkFairnessFromScores(personId: string, state: AppState, scoresById: Record<string, WorkloadScore>) {
      const p = this.person(state, personId);
      if(!p || !scoresById[personId]) return null;
      const myScore = scoresById[personId];
      const peers = state.people.filter(x => x.grade === p.grade && x.unitId === p.unitId && x.id !== p.id);
      if (peers.length === 0) return { status: 'Balanced', diff: 0, msg: 'No comparable peers' };
      const peerAvg = peers.reduce((sum, peer) => sum + (scoresById[peer.id]?.utilizationPct || 0), 0) / peers.length;
      const diff = myScore.utilizationPct - peerAvg;
      if (diff > 25) return { status: 'Overloaded', diff, msg: `+${diff.toFixed(0)}% vs Peers` };
      if (diff < -25) return { status: 'Underutilized', diff, msg: `${diff.toFixed(0)}% vs Peers` };
      return { status: 'Balanced', diff, msg: 'Balanced with peers' };
  },

  // --- Scoring & RAG ---
  healthScore(state: AppState, subset?: WorkItem[]) {
    const H = state.settings.weights.health;
    const items = subset || state.workItems;
    if (items.length === 0) return 100;
    const total = items.reduce((sum, wi) => {
        let pScore = 100;
        const pack = state.packs[wi.id];
        if (pack?.raid) {
            pack.raid.filter(r => r.type === "Risk" && r.status !== "Closed").forEach(r => {
                pScore -= (H.impactWeight[r.impact] ?? 5);
                if (r.status === "Blocked") pScore -= H.blockedPenalty;
                if (r.due && new Date(r.due).getTime() < Date.now()) pScore -= H.overduePenalty;
            });
        }
        const age = this.reportAgeDays(state, wi.id);
        const exp = state.settings.weights.reporting.expectedUpdateDaysByLifecycle[wi.lifecycleId] ?? 14;
        if (age === null) pScore -= 25; 
        else if (age > exp) pScore -= Math.min(30, (age - exp) * 2);
        return sum + Math.max(0, pScore);
    }, 0);
    return Math.round(total / items.length);
  },

  ragAnalysis(state: AppState, workId: string) {
    const wi = state.workItems.find(x => x.id === workId);
    if (!wi) return { status: "Green", reasons: [] };
    const gov = state.settings.weights.governance;
    const pack = state.packs[workId];
    const isCritical = (wi.lifecycleId === "L-CUR" || wi.lifecycleId === "L-PRO");
    const exp = isCritical ? gov.staleReportDaysCritical : gov.staleReportDaysStandard;
    const age = this.reportAgeDays(state, workId);
    const reasons: any[] = [];
    let isRed = false, isAmber = false;
    if (age === null || age > exp) {
        isRed = isCritical; isAmber = !isCritical;
        reasons.push({ label: age === null ? "No reports filed" : `Report stale (${age}d)`, impact: 'High' });
    }
    if (pack?.raid) {
        const overdueHigh = pack.raid.filter(r => r.type === "Risk" && r.impact === "High" && r.status !== "Closed" && r.due && new Date(r.due).getTime() < Date.now());
        if (overdueHigh.length > 0) { isRed = true; reasons.push({ label: "Overdue High Risks", impact: 'High' }); }
    }
    return { status: (isRed ? "Red" : isAmber ? "Amber" : "Green") as any, reasons };
  },

  ragForWork(state: AppState, workId: string) { return this.ragAnalysis(state, workId).status; },

  getAccessLevel(personId: string | null): AccessLevel {
      if(!personId) return AccessLevel.Tier4_Observer;
      const tier1 = ["MP", "DMP", "GG-AP"]; 
      if(tier1.includes(personId)) return AccessLevel.Tier1_Strategic;
      return AccessLevel.Tier3_Operational;
  }
};
