
import { AppState, WorkItem, Person, Report, RaidItem, AccessLevel, WorkloadScore, WorkloadSettings, StaffingEntry } from '../types';

export const Compute = {
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
    const sorted = [...pack.reports].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return sorted[0];
  },
  reportAgeDays(state: AppState, workId: string): number | null {
    const r = this.lastReport(state, workId);
    if (!r) return null;
    const ms = Date.now() - new Date(r.ts).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  },
  reportingCompliance(state: AppState) {
    const cfg = state.settings.weights.reporting.expectedUpdateDaysByLifecycle;
    let compliant = 0, nonCompliant = 0, missing = 0;
    const detail: { id: string; reason: string }[] = [];
    
    for (const wi of state.workItems) {
      const exp = cfg[wi.lifecycleId] ?? 14;
      const age = this.reportAgeDays(state, wi.id);
      
      if (age === null) {
        missing++;
        nonCompliant++;
        detail.push({ id: wi.id, reason: "Missing report" });
      } else if (age <= exp) {
        compliant++;
      } else {
        nonCompliant++;
        detail.push({ id: wi.id, reason: `Report age ${age}d (Limit: ${exp}d)` });
      }
    }
    return { total: state.workItems.length, compliant, nonCompliant, missing, detail };
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
          // Count only High Impact risks that are Open or Blocked
          c += pack.raid.filter(r => r.type === "Risk" && r.impact === "High" && r.status !== "Closed").length;
      }
    }
    return c;
  },
  risksByImpact(state: AppState) {
    const out: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    for (const wi of state.workItems) {
      const pack = state.packs[wi.id];
      if (pack?.raid) {
          for (const r of pack.raid) {
            if (r.type !== "Risk" || r.status === "Closed") continue;
            out[r.impact] = (out[r.impact] || 0) + 1;
          }
      }
    }
    return out;
  },

  // --- NEW WORKLOAD ENGINE ---
  
  // Reusable core math for a single assignment
  calculateAssignmentLoad(
      assignment: StaffingEntry, 
      workItem: WorkItem, 
      settings: WorkloadSettings
  ): { points: number, isCommitted: boolean, roleCategory: string } {
      // Stage Multiplier - Looks up by lifecycleId
      // Fallback to legacy 'stage' property if 'lifecycleId' missing (backward compatibility)
      const stageSetting = settings.stageMultipliers.find((s: any) => s.lifecycleId === workItem.lifecycleId || s.stage === workItem.lifecycleId);
      const stageMult = stageSetting ? stageSetting.multiplier : 0.5;
      const isCommitted = stageSetting ? stageSetting.isCommitted : false;

      // Role Weight
      const roleSetting = settings.roleWeights.find((r: any) => r.role === assignment.roleKey);
      const roleWeight = roleSetting ? roleSetting.weight : 1.0;
      const roleCategory = roleSetting ? roleSetting.category : 'Execution';

      // Complexity Factor
      const compSetting = settings.complexityFactors.find((c: any) => c.level === (workItem.complexity || 3));
      const compFactor = compSetting ? compSetting.factor : 1.0;

      // Allocation Factor
      let allocPct = assignment.allocation;
      if (allocPct === undefined) {
          const defAlloc = settings.defaultAllocations.find((d: any) => d.role === assignment.roleKey);
          allocPct = defAlloc ? defAlloc.percent : 50;
      }
      const allocFactor = allocPct / 100;

      // Formula
      const points = stageMult * roleWeight * compFactor * allocFactor;

      return { points, isCommitted, roleCategory };
  },

  // Calculates detailed scores for every person based on new rules
  calculateWorkloadScore(person: Person, state: AppState): WorkloadScore {
    const settings = state.settings.workload;
    
    // 1. Get Grade Capacity Base
    // Safe Fallback: If 'Fractional' or specific grade is missing, use a generic default to prevent crash
    const defaultGrade = { weeklyPoints: 5.0, maxCurrent: 3, maxTotal: 5, targetExecPct: 50, targetOversightPct: 50, notes: "Fallback", budgetDetail: "" };
    const gradeCap = settings.gradeCapacities.find(g => g.grade === person.grade) 
                  || settings.gradeCapacities.find(g => g.grade === 'Fractional')
                  || defaultGrade;
                  
    const gradeCapBase = gradeCap.weeklyPoints;

    // 2. Calculate Effective Capacity (Mod / 10)
    // Default to 10 if missing
    const mod = person.profile.capacityModifier !== undefined ? person.profile.capacityModifier : 10;
    const effectiveCap = gradeCapBase * (mod / 10);

    let committedLoad = 0;
    let pipelineLoad = 0;
    let committedItems = 0;
    let totalItems = 0;
    const rolePoints: Record<string, number> = { Oversight: 0, DeliveryLead: 0, Execution: 0, PeopleManagement: 0 };

    // 3. Process Assignments
    state.workItems.forEach(wi => {
        // Data Integrity Check: Ensure assignment points to this valid person
        const assignment = wi.staffing.find(s => s.personId === person.id);
        if(!assignment) return;

        // Use unified calculation
        const result = this.calculateAssignmentLoad(assignment, wi, settings);

        // Aggregation
        if(result.isCommitted) {
            committedLoad += result.points;
            committedItems++;
        } else {
            pipelineLoad += result.points;
        }
        totalItems++;
        
        // Role Breakdown (Commit + Pipeline)
        rolePoints[result.roleCategory] = (rolePoints[result.roleCategory] || 0) + result.points;
    });

    // 4. Calculate Penalties (Concurrency)
    let penaltyPoints = 0;
    
    // Config values
    const penCurrent = settings.burnoutConfig.find((c: any) => c.key === 'penalty_per_extra_current_item')?.value || 0.8;
    const penTotal = settings.burnoutConfig.find((c: any) => c.key === 'penalty_per_extra_total_item')?.value || 0.4;
    
    if (committedItems > gradeCap.maxCurrent) {
        penaltyPoints += (committedItems - gradeCap.maxCurrent) * penCurrent;
    }
    if (totalItems > gradeCap.maxTotal) {
        penaltyPoints += (totalItems - gradeCap.maxTotal) * penTotal;
    }

    // 5. Management Load
    // Filter direct reports to ensure they actually exist in state (prevent zombie load)
    // Fallback: If no direct reports listed, check if they are listed as formal manager for anyone
    let validReports = (person.profile.directReports || []).filter((rid: string) => state.people.some((p: any) => p.id === rid));
    
    if (validReports.length === 0) {
        validReports = state.people.filter(p => p.formalManagerId === person.id).map(p => p.id);
    }

    const reportCount = validReports.length;
    const penMgmt = settings.burnoutConfig.find((c: any) => c.key === 'per_direct_report_weight')?.value || 0.25;
    const mgmtLoad = reportCount * penMgmt;

    // 6. Final Score & Utilization
    const totalLoad = committedLoad + pipelineLoad;
    const finalScore = totalLoad + penaltyPoints + mgmtLoad;
    
    // Utilization % - Guard against divide by zero
    const utilPct = effectiveCap > 0 ? (finalScore / effectiveCap) * 100 : 0;

    // 7. Determine Risk Band
    const amberThresh = settings.burnoutConfig.find((c: any) => c.key === 'amber_threshold')?.value || 100;
    const redThresh = settings.burnoutConfig.find((c: any) => c.key === 'red_threshold')?.value || 120;

    let risk: 'Green' | 'Amber' | 'Red' = 'Green';
    if (utilPct >= redThresh) risk = 'Red';
    else if (utilPct >= amberThresh) risk = 'Amber';

    return {
        personId: person.id,
        gradeCapBase,
        effectiveCap,
        committedLoad,
        pipelineLoad,
        totalLoad,
        penaltyPoints,
        mgmtLoad,
        finalScore,
        utilizationPct: utilPct,
        risk,
        breakdown: {
            items: totalItems,
            committedItems,
            concurrencyPenalty: penaltyPoints,
            roles: rolePoints
        }
    };
  },

  // Bulk calculation for performance
  calculateAllWorkloadScores(state: AppState): Record<string, WorkloadScore> {
      const scores: Record<string, WorkloadScore> = {};
      state.people.forEach(p => {
          scores[p.id] = this.calculateWorkloadScore(p, state);
      });
      return scores;
  },

  // Legacy wrapper for chart compatibility, now using new engine
  workloadByPerson(state: AppState): Record<string, number> {
      const out: Record<string, number> = {};
      state.people.forEach(p => {
          const score = this.calculateWorkloadScore(p, state);
          out[p.id] = score.finalScore; 
      });
      return out;
  },

  // Optimization: Check fairness using pre-calculated scores map
  checkFairnessFromScores(personId: string, state: AppState, scoresById: Record<string, WorkloadScore>) {
      const p = this.person(state, personId);
      if(!p || !scoresById[personId]) return null;
      
      const myScore = scoresById[personId];
      
      // Peer Group 1: Same Grade AND Same Unit (Specific Peers)
      const gradePeers = state.people.filter(x => x.grade === p.grade && x.unitId === p.unitId && x.id !== p.id);
      
      // Peer Group 2: All Unit Members (Broader Context)
      const unitPeers = state.people.filter(x => x.unitId === p.unitId && x.id !== p.id);

      // Calculations
      let gradePeerAvg = 0;
      if (gradePeers.length > 0) {
          const scores = gradePeers.map(peer => scoresById[peer.id]?.utilizationPct || 0);
          gradePeerAvg = scores.reduce((a,b)=>a+b, 0) / scores.length;
      }

      let unitAvg = 0;
      if (unitPeers.length > 0) {
          const scores = unitPeers.map(peer => scoresById[peer.id]?.utilizationPct || 0);
          unitAvg = scores.reduce((a,b)=>a+b, 0) / scores.length;
      }
      
      const diffGrade = myScore.utilizationPct - gradePeerAvg;
      const diffUnit = myScore.utilizationPct - unitAvg;

      if (gradePeers.length > 0) {
          if (diffGrade > 20) return { status: 'Overloaded', diff: diffGrade, msg: `+${diffGrade.toFixed(0)}% vs Grade Peers` };
          if (diffGrade < -20) return { status: 'Underutilized', diff: diffGrade, msg: `${diffGrade.toFixed(0)}% vs Grade Peers` };
      } else {
          if (diffUnit > 25) return { status: 'Overloaded', diff: diffUnit, msg: `+${diffUnit.toFixed(0)}% vs Unit Avg` };
      }

      if (Math.abs(diffGrade) <= 20 && diffUnit > 30) {
           return { status: 'Overloaded', diff: diffUnit, msg: `+${diffUnit.toFixed(0)}% vs Unit Avg` };
      }

      return { status: 'Balanced', diff: diffGrade, msg: 'Within peer range' };
  },

  // Legacy fallback for single person check
  checkFairness(personId: string, state: AppState) {
      const scores = this.calculateAllWorkloadScores(state);
      return this.checkFairnessFromScores(personId, state, scores);
  },

  // --- Scoring & RAG (Health) ---
  healthScore(state: AppState, subset?: WorkItem[]) {
    const H = state.settings.weights.health;
    let totalScore = 0;
    let count = 0;

    const items = subset || state.workItems;

    for (const wi of items) {
        let projectScore = 100;
        const pack = state.packs[wi.id];
        
        if (pack?.raid) {
            const activeRisks = pack.raid.filter(r => r.type === "Risk" && r.status !== "Closed");
            for (const r of activeRisks) {
                projectScore -= (H.impactWeight[r.impact] ?? 5);
                if (r.status === "Blocked") projectScore -= H.blockedPenalty;
                if (r.due && new Date(r.due).getTime() < Date.now()) projectScore -= H.overduePenalty;
            }
        }
        
        const age = this.reportAgeDays(state, wi.id);
        const exp = state.settings.weights.reporting.expectedUpdateDaysByLifecycle[wi.lifecycleId] ?? 14;
        
        if (age === null) {
             projectScore -= 25; 
        } else if (age > exp) {
             projectScore -= Math.min(30, (age - exp) * 2);
        }

        const required = (wi.typeId === "T-PRO") ? ["PD", "PM"] : (wi.typeId === "T-ENG") ? ["ED", "EM"] : [];
        for (const rk of required) {
            if (!wi.staffing?.some(s => s.roleKey === rk && s.personId)) {
                projectScore -= H.missingRolePenalty;
            }
        }

        totalScore += Math.max(0, projectScore);
        count++;
    }

    return count === 0 ? 100 : Math.round(totalScore / count);
  },

  ragAnalysis(state: AppState, workId: string) {
    const wi = state.workItems.find(x => x.id === workId);
    if (!wi) return { status: "Green", reasons: [], meta: {} };
    
    // Read governance rules, with fallbacks for safety if state is old
    const govRules = state.settings.weights.governance || {
        riskVolumeThreshold: 5,
        staleReportDaysCritical: 7,
        staleReportDaysStandard: 14
    };

    const pack = state.packs[workId];
    // Dynamic expiry based on lifecycle
    const isCriticalPhase = (wi.lifecycleId === "L-CUR" || wi.lifecycleId === "L-PRO");
    const exp = isCriticalPhase ? govRules.staleReportDaysCritical : govRules.staleReportDaysStandard;
    const age = this.reportAgeDays(state, workId);

    const reasons: { label: string; impact: 'High'|'Medium'|'Low'; type: 'Report'|'Risk'|'Governance' }[] = [];
    let isRed = false;
    let isAmber = false;

    // 1. Reporting Freshness
    const stale = (age !== null) ? (age > exp) : true;
    if (stale) {
        if (isCriticalPhase) {
             isRed = true;
             reasons.push({ label: age === null ? "Never reported" : `Report overdue (${age} days)`, impact: 'High', type: 'Report' });
        } else {
             isAmber = true;
             reasons.push({ label: age === null ? "Never reported" : `Report overdue (${age} days)`, impact: 'Medium', type: 'Report' });
        }
    }

    // 2. Risk Profile
    if (pack?.raid) {
        const openRisks = pack.raid.filter(r => r.type === "Risk" && r.status !== "Closed");
        const highRisks = openRisks.filter(r => r.impact === "High");
        const overdueHigh = highRisks.filter(r => r.due && new Date(r.due).getTime() < Date.now());

        if (overdueHigh.length > 0) {
            isRed = true;
            reasons.push({ label: `${overdueHigh.length} Overdue High Impact Risks`, impact: 'High', type: 'Risk' });
        } else if (highRisks.length > 0) {
            isAmber = true;
            reasons.push({ label: `${highRisks.length} High Impact Risks Open`, impact: 'Medium', type: 'Risk' });
        }
        
        if (openRisks.length > govRules.riskVolumeThreshold) {
             isAmber = true;
             reasons.push({ label: `High Risk Volume (${openRisks.length})`, impact: 'Medium', type: 'Risk' });
        }
    }

    let status = "Green";
    if (isRed) status = "Red";
    else if (isAmber) status = "Amber";

    return { status, reasons, meta: { lastReportAge: age, allowedGap: exp } };
  },

  ragForWork(state: AppState, workId: string) {
    return this.ragAnalysis(state, workId).status;
  },

  getAccessLevel(personId: string | null): AccessLevel {
      if(!personId) return AccessLevel.Tier4_Observer;
      const tier1 = ["MP", "DMP", "GG-AP", "PDM-SAS"]; 
      if(tier1.includes(personId)) return AccessLevel.Tier1_Strategic;
      return AccessLevel.Tier3_Operational;
  },

  // --- DATA DIAGNOSTICS ---
  runDiagnostics(state: AppState) {
      const issues: string[] = [];
      
      // 1. Check for Zombie Staffing
      state.workItems.forEach(w => {
          w.staffing.forEach(s => {
              if (s.personId && !state.people.some(p => p.id === s.personId)) {
                  issues.push(`Work Item ${w.id} has invalid assignment: ${s.personId}`);
              }
          });
      });

      // 2. Check for Circular Reporting Lines
      state.people.forEach(p => {
          let current = p.formalManagerId;
          const visited = new Set<string>();
          visited.add(p.id);
          
          let depth = 0;
          while(current && current !== 'Board' && depth < 20) {
              if (visited.has(current)) {
                  issues.push(`Circular reporting line detected for ${p.name} involving ${current}`);
                  break;
              }
              visited.add(current);
              const mgr = state.people.find(m => m.id === current);
              current = mgr ? mgr.formalManagerId : null;
              depth++;
          }
      });

      // 3. Check for Orphan Projects (No valid Unit)
      state.workItems.forEach(w => {
          if (!state.settings.taxonomy.units.some(u => u.id === w.teamUnitId)) {
              issues.push(`Work Item ${w.id} assigned to non-existent unit: ${w.teamUnitId}`);
          }
      });

      return issues;
  }
};
