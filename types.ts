
export interface Unit { id: string; name: string; }
export interface Lifecycle { id: string; name: string; }
export interface WorkType { id: string; name: string; }
export interface RaidType { types: string[]; status: string[]; impact: string[]; probability: string[]; }
export interface RoleKey { key: string; name: string; }
export interface ProfileField { key: string; label: string; type: 'text' | 'number' | 'enum' | 'multi'; options?: string[]; default: any; }

// --- WORKLOAD ENGINE CONFIGURATION TYPES ---
export interface StageMultiplier { lifecycleId: string; multiplier: number; isCommitted: boolean; notes: string; }
export interface RoleWeight { role: string; weight: number; category: 'Oversight'|'DeliveryLead'|'Execution'|'PeopleManagement'|'External'; notes: string; }
export interface DefaultAllocation { role: string; percent: number; notes: string; }
export interface GradeCapacity { grade: string; weeklyPoints: number; maxCurrent: number; maxTotal: number; targetExecPct: number; targetOversightPct: number; budgetDetail: string; notes: string; }
export interface ComplexityFactor { level: number; factor: number; notes: string; }
export interface BurnoutConfig { key: string; value: number; unit: string; notes: string; }

export interface WorkloadSettings {
  stageMultipliers: StageMultiplier[];
  roleWeights: RoleWeight[];
  defaultAllocations: DefaultAllocation[];
  gradeCapacities: GradeCapacity[];
  complexityFactors: ComplexityFactor[];
  burnoutConfig: BurnoutConfig[];
}

export interface WorkloadVersion {
  id: string;
  ts: string;
  userId: string;
  config: WorkloadSettings;
  note: string;
}

export interface Taxonomy {
  units: Unit[];
  lifecycle: Lifecycle[];
  workTypes: WorkType[];
  raid: RaidType;
  roleKeys: RoleKey[];
}

export interface Templates {
  raciDecisionAreas: string[];
}

export interface GovernanceRules {
  riskVolumeThreshold: number;
  staleReportDaysCritical: number;
  staleReportDaysStandard: number;
}

export interface Weights {
  // Legacy weights (kept for backward compat if needed, but largely superseded by WorkloadSettings)
  health: {
    impactWeight: Record<string, number>;
    overduePenalty: number;
    blockedPenalty: number;
    missingRolePenalty: number;
  };
  governance: GovernanceRules;
  reporting: {
    expectedUpdateDaysByLifecycle: Record<string, number>;
  };
}

export interface AppSettings {
  taxonomy: Taxonomy;
  templates: Templates;
  weights: Weights;
  workload: WorkloadSettings; // The New Single Source of Truth
  workloadHistory: WorkloadVersion[];
  profileFields: ProfileField[];
}

export interface PersonProfileData {
  availability: string;
  capacityTarget: number; // Legacy field, kept for reference
  capacityModifier: number; // 1-10 Scale
  skills: string[];
  notes: string;
  transitionNotes?: string;
  recurringRoles?: string[];
  directReports?: string[];
  [key: string]: any;
}

export interface Person {
  id: string;
  code: string;
  name: string;
  title: string;
  unitId: string;
  grade: string;
  formalManagerId: string | null;
  dottedManagerId: string | null;
  profile: PersonProfileData;
}

export interface StaffingEntry {
  roleKey: string;
  personId: string | null;
  externalName: string | null;
  allocation?: number; // Optional override %
}

export interface WorkItem {
  id: string;
  name: string;
  typeId: string;
  lifecycleId: string;
  teamUnitId: string;
  externalPartners: string[];
  description: string;
  complexity: number; // 1-5
  staffing: StaffingEntry[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RaidItem {
  id: string;
  type: string;
  status: string;
  impact: string;
  probability: string;
  title: string;
  description: string;
  ownerId: string | null;
  due: string | null;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RaciRow {
  id: string;
  area: string;
  r: string; // role key
  a: string; // role key
  c: string[]; // role keys
  i: string[]; // role keys
}

export interface Decision {
  id: string;
  date: string;
  title: string;
  outcome: string;
  ownerId: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  ts: string;
  rag: 'Green' | 'Amber' | 'Red';
  summary: string;
  achievements: string[];
  nextSteps: string[];
  asks: string[];
  blockers: string[];
  by: string | null;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface ReportingSchedule {
  cadence: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'None';
  dayOfWeek?: string; // e.g., "Friday"
  timeOfDay?: string; // e.g., "17:00"
  format: 'CSV' | 'PDF';
  recipients: string[];
  lastRun?: string;
}

export interface Pack {
  raid: RaidItem[];
  raci: RaciRow[];
  decisions: Decision[];
  reports: Report[];
  comments: Comment[];
  reportingSchedule?: ReportingSchedule;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  ts: string;
  entity: { type: string; id: string };
  action: string;
  diff: any;
  userId: string;
}

export enum AccessLevel {
  Tier1_Strategic = 1, // Admin / Partner
  Tier2_Tactical = 2,  // Unit Head
  Tier3_Operational = 3, // Team Member
  Tier4_Observer = 4   // Viewer
}

export interface HistoryEntry {
  view: string;
  activeWorkId: string | null;
  activePersonId: string | null;
}

export interface AppState {
  meta: {
    schemaVersion: string;
    createdAt: string;
    updatedAt: string;
    org: { name: string; code: string; b3: string };
  };
  ui: {
    theme: 'dark' | 'light';
    view: string;
    activeWorkId: string | null;
    activePersonId: string | null;
    currentUser: string | null; // ID of logged in user
    isAuthenticated: boolean;
    sidebarCollapsed: boolean;
    history: HistoryEntry[]; // Navigation stack
    filters: {
      lifecycleId: string | null;
      unitId: string | null;
      typeId: string | null;
      search: string;
    };
    projectTab?: string;
  };
  settings: AppSettings;
  people: Person[];
  workItems: WorkItem[];
  packs: Record<string, Pack>;
  audit: AuditLog[];
}

// --- COMPUTED TYPES ---
export interface WorkloadScore {
  personId: string;
  gradeCapBase: number;
  effectiveCap: number; // After 1-10 mod
  committedLoad: number;
  pipelineLoad: number;
  totalLoad: number;
  penaltyPoints: number;
  mgmtLoad: number;
  finalScore: number;
  utilizationPct: number; // finalScore / effectiveCap
  risk: 'Green' | 'Amber' | 'Red';
  breakdown: {
    items: number;
    committedItems: number;
    concurrencyPenalty: number;
    roles: Record<string, number>; // Points by role category
  }
}
