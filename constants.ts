
import { AppState, Person, WorkItem, Pack, WorkloadSettings } from './types';

export const SCHEMA_VERSION = "10.1.0";
export const STORAGE_KEY = "murty_v10_prod";

// --- SEED DATA FROM CSVs ---
const WORKLOAD_SETTINGS: WorkloadSettings = {
  stageMultipliers: [
    { stage: "Current Engagements", multiplier: 1.00, isCommitted: true, notes: "Committed delivery; highest load signal" },
    { stage: "Closed Deals", multiplier: 0.85, isCommitted: true, notes: "Near-term load; slightly discounted vs fully active delivery" },
    { stage: "Live Proposals", multiplier: 0.55, isCommitted: true, notes: "Pipeline pressure; meaningful load but below delivery" },
    { stage: "Engagements in Discussion", multiplier: 0.30, isCommitted: false, notes: "Early pipeline; light load signal" }
  ],
  roleWeights: [
    { role: "PD", weight: 2.20, category: "Oversight", notes: "High accountability; decision load; client-facing" },
    { role: "PM", weight: 1.60, category: "Oversight", notes: "High throughput and coordination" },
    { role: "ED", weight: 2.00, category: "Oversight", notes: "Senior oversight; client interface; quality ownership" },
    { role: "EM", weight: 1.70, category: "DeliveryLead", notes: "Delivery coordination; planning; risk management" },
    { role: "EA", weight: 1.20, category: "Execution", notes: "Execution with analysis pressure" }, 
    { role: "TM", weight: 1.00, category: "Execution", notes: "Baseline execution contribution" },
    { role: "LM", weight: 0.60, category: "PeopleManagement", notes: "Per-engagement accountability" },
    { role: "EXT", weight: 0.00, category: "External", notes: "Not a tracked internal capacity contributor" }
  ],
  defaultAllocations: [
    { role: "PD", percent: 25, notes: "Senior accountability" },
    { role: "PM", percent: 40, notes: "Coordination + drafting" },
    { role: "ED", percent: 20, notes: "Oversight" },
    { role: "EM", percent: 60, notes: "Core delivery management" },
    { role: "EA", percent: 70, notes: "Primary execution load" },
    { role: "TM", percent: 60, notes: "Execution contribution" },
    { role: "LM", percent: 10, notes: "Low but persistent oversight" },
    { role: "EXT", percent: 0, notes: "External" }
  ],
  gradeCapacities: [
    { grade: "Partner", weeklyPoints: 9.0, maxCurrent: 4, maxTotal: 12, targetExecPct: 10, targetOversightPct: 90, budgetDetail: "", notes: "High involvement via oversight/proposals" },
    { grade: "Associate Partner", weeklyPoints: 9.5, maxCurrent: 4, maxTotal: 12, targetExecPct: 15, targetOversightPct: 85, budgetDetail: "", notes: "Similar to Partner but slightly more delivery" },
    { grade: "Senior Manager", weeklyPoints: 10.0, maxCurrent: 4, maxTotal: 10, targetExecPct: 25, targetOversightPct: 75, budgetDetail: "", notes: "High oversight + delivery lead" },
    { grade: "Manager", weeklyPoints: 11.0, maxCurrent: 4, maxTotal: 10, targetExecPct: 40, targetOversightPct: 60, budgetDetail: "", notes: "Balanced; significant management load" },
    { grade: "Manager (Corporate Services)", weeklyPoints: 10.5, maxCurrent: 4, maxTotal: 9, targetExecPct: 55, targetOversightPct: 45, budgetDetail: "", notes: "Comparable to Manager" },
    { grade: "Senior Associate", weeklyPoints: 11.0, maxCurrent: 4, maxTotal: 9, targetExecPct: 55, targetOversightPct: 45, budgetDetail: "", notes: "Bridge role" },
    { grade: "Associate", weeklyPoints: 10.0, maxCurrent: 3, maxTotal: 8, targetExecPct: 70, targetOversightPct: 30, budgetDetail: "", notes: "Execution-heavy" },
    { grade: "Senior Analyst", weeklyPoints: 9.5, maxCurrent: 3, maxTotal: 7, targetExecPct: 75, targetOversightPct: 25, budgetDetail: "", notes: "Execution-heavy with complexity" },
    { grade: "Analyst", weeklyPoints: 9.0, maxCurrent: 3, maxTotal: 7, targetExecPct: 80, targetOversightPct: 20, budgetDetail: "", notes: "Core execution capacity" },
    { grade: "Graduate Intern", weeklyPoints: 7.0, maxCurrent: 2, maxTotal: 5, targetExecPct: 85, targetOversightPct: 15, budgetDetail: "", notes: "Protect strongly" },
    { grade: "Officer", weeklyPoints: 8.0, maxCurrent: 3, maxTotal: 7, targetExecPct: 75, targetOversightPct: 25, budgetDetail: "", notes: "For corporate services" },
    { grade: "Fractional", weeklyPoints: 5.0, maxCurrent: 3, maxTotal: 5, targetExecPct: 50, targetOversightPct: 50, budgetDetail: "", notes: "Fractional role default" }
  ],
  complexityFactors: [
    { level: 1, factor: 0.80, notes: "Small/simple work" },
    { level: 2, factor: 0.90, notes: "Below average complexity" },
    { level: 3, factor: 1.00, notes: "Default" },
    { level: 4, factor: 1.15, notes: "Complex delivery / higher coordination" },
    { level: 5, factor: 1.30, notes: "Highly complex / high risk" }
  ],
  burnoutConfig: [
    { key: "penalty_per_extra_current_item", value: 0.80, unit: "points", notes: "Penalty per engagement above max_current" },
    { key: "penalty_per_extra_total_item", value: 0.40, unit: "points", notes: "Penalty per item above max_total" },
    { key: "per_direct_report_weight", value: 0.25, unit: "points", notes: "People management load per direct report" },
    { key: "amber_threshold", value: 50, unit: "score", notes: "Risk band boundary (Utilization %)" },
    { key: "red_threshold", value: 70, unit: "score", notes: "Risk band boundary (Utilization %)" }
  ]
};

// Map existing people to new structure with Capacity Modifier
const people: Person[] = [
  {
    id: "MP", code: "MP", name: "Abdul Oladapo", title: "Managing Partner", unitId: "U-CM", grade: "Partner",
    formalManagerId: "Board", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Leadership", "Governance"], notes: "", transitionNotes: "Transitioning to Senior Partner", recurringRoles: ["Line Manager", "Client Director", "Engagement Director", "Proposal Director"], directReports: ["DMP", "CFO", "CS-SIM", "GG-AP", "PDM-SAS"] }
  },
  {
    id: "DMP", code: "DMP", name: "Olufemi Osanyinro", title: "Deputy Managing Partner", unitId: "U-CM", grade: "Associate Partner",
    formalManagerId: "MP", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Leadership", "Operations"], notes: "", transitionNotes: "Transitioning to MP", recurringRoles: ["Line Manager", "Engagement Director", "Proposal Director"], directReports: ["CS-FM", "CS-OHRM", "TA-SM", "PDM-M"] }
  },
  {
    id: "CFO", code: "CFO", name: "Omowunmi Akinwande", title: "Fractional CFO", unitId: "U-CS", grade: "Fractional",
    formalManagerId: "MP", dottedManagerId: "DMP",
    profile: { availability: "Part-time", capacityTarget: 2.0, capacityModifier: 5, skills: ["Finance"], notes: "", transitionNotes: "Adhoc role", recurringRoles: [] }
  },
  {
    id: "CS-FM", code: "CS-FM", name: "Ndidi Omo Okorie", title: "Finance Manager", unitId: "U-CS", grade: "Manager (Corporate Services)",
    formalManagerId: "DMP", dottedManagerId: "MP",
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Finance"], notes: "", recurringRoles: ["Line Manager"], directReports: ["CS-FO"] }
  },
  {
    id: "CS-SIM", code: "CS-SIM", name: "Hadiza Muhammad", title: "Strategic Initiatives Manager", unitId: "U-CS", grade: "Manager (Corporate Services)",
    formalManagerId: "MP", dottedManagerId: "DMP",
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Strategy"], notes: "", recurringRoles: [] }
  },
  {
    id: "CS-OHRM", code: "CS-OHRM", name: "Joan Anyim-Odu", title: "Operations and HR Manager", unitId: "U-CS", grade: "Manager (Corporate Services)",
    formalManagerId: "DMP", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["HR", "Operations"], notes: "", recurringRoles: ["Line Manager"], directReports: ["CS-CSO"] }
  },
  {
    id: "CS-FO", code: "CS-FO", name: "Moshood Muhammed", title: "Finance Officer", unitId: "U-CS", grade: "Officer",
    formalManagerId: "CS-FM", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Finance"], notes: "", recurringRoles: [] }
  },
  {
    id: "CS-CSO", code: "CS-CSO", name: "Emmanuel Kayode-Thomas", title: "Corporate Services Officer", unitId: "U-CS", grade: "Officer",
    formalManagerId: "CS-OHRM", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Operations"], notes: "", recurringRoles: [] }
  },
  {
    id: "GG-AP", code: "GG-AP", name: "Adnan Aminu PhD", title: "Head, Green Growth (Associate Partner)", unitId: "U-GG", grade: "Associate Partner",
    formalManagerId: "MP", dottedManagerId: "DMP",
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Green Growth", "Policy"], notes: "", recurringRoles: ["Line Manager", "Engagement Director", "Proposal Director"], directReports: ["GG-SAS", "GG-AS"] }
  },
  {
    id: "GG-SAS", code: "GG-SAS", name: "Abubakar Tanimu", title: "Senior Associate, Green Growth", unitId: "U-GG", grade: "Senior Associate",
    formalManagerId: "GG-AP", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Green Growth"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["GG-GI-02"] }
  },
  {
    id: "GG-AS", code: "GG-AS", name: "Aminat Kareem", title: "Associate, Green Growth", unitId: "U-GG", grade: "Associate",
    formalManagerId: "GG-AP", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Green Growth"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["GG-AN", "GG-GI-01"] }
  },
  {
    id: "GG-AN", code: "GG-AN", name: "Islamiat Oseni", title: "Analyst, Green Growth", unitId: "U-GG", grade: "Analyst",
    formalManagerId: "GG-AS", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Analysis", "Green Growth"], notes: "", recurringRoles: ["Engagement Manager", "Proposal Manager"] }
  },
  {
    id: "GG-GI-01", code: "GG-GI-01", name: "Oluwasubomi Oyelade", title: "Graduate Intern, Green Growth", unitId: "U-GG", grade: "Graduate Intern",
    formalManagerId: "GG-AS", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Support"], notes: "", recurringRoles: ["Engagement Manager", "Proposal Manager"] }
  },
  {
    id: "GG-GI-02", code: "GG-GI-02", name: "Fatima Sadiq Eldaw", title: "Graduate Intern, Green Growth", unitId: "U-GG", grade: "Graduate Intern",
    formalManagerId: "GG-SAS", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Support"], notes: "", recurringRoles: [] }
  },
  {
    id: "TA-SM", code: "TA-SM", name: "Sesan Adedapo", title: "Head, Transaction Advisory (Senior Manager)", unitId: "U-TA", grade: "Senior Manager",
    formalManagerId: "DMP", dottedManagerId: "MP",
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Transaction Advisory", "Feasibility"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["TA-SAS-01", "TA-SAS-02"] }
  },
  {
    id: "TA-SAS-01", code: "TA-SAS-01", name: "Margaret Akinbamijo", title: "Senior Associate, Transaction Advisory", unitId: "U-TA", grade: "Senior Associate",
    formalManagerId: "TA-SM", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Transaction Advisory"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["TA-AS-02", "TA-SAN"] }
  },
  {
    id: "TA-SAS-02", code: "TA-SAS-02", name: "Aisha Iya-Abubakar", title: "Senior Associate, Transaction Advisory", unitId: "U-TA", grade: "Senior Associate",
    formalManagerId: "TA-SM", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Transaction Advisory"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["TA-AS-01", "TA-AS-03"] }
  },
  {
    id: "TA-AS-01", code: "TA-AS-01", name: "Beatrice Simon", title: "Associate, Transaction Advisory", unitId: "U-TA", grade: "Associate",
    formalManagerId: "TA-SAS-02", dottedManagerId: null,
    profile: { availability: "Leave", capacityTarget: 0.0, capacityModifier: 0, skills: ["Transaction Advisory"], notes: "Currently on maternity leave", recurringRoles: ["Engagement Manager", "Proposal Manager"] }
  },
  {
    id: "TA-AS-02", code: "TA-AS-02", name: "Tolulope Afolayan", title: "Associate, Transaction Advisory", unitId: "U-TA", grade: "Associate",
    formalManagerId: "TA-SAS-01", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Transaction Advisory"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["TA-GF-01", "TA-GF-02"] }
  },
  {
    id: "TA-AS-03", code: "TA-AS-03", name: "Ameenah Abdullahi", title: "Associate, Transaction Advisory", unitId: "U-TA", grade: "Associate",
    formalManagerId: "TA-SAS-02", dottedManagerId: null,
    profile: { availability: "Sick", capacityTarget: 0.0, capacityModifier: 0, skills: ["Transaction Advisory"], notes: "Currently on long term sick leave", recurringRoles: ["Engagement Manager", "Proposal Manager"] }
  },
  {
    id: "TA-SAN", code: "TA-SAN", name: "Yusuf Ibrahim", title: "Senior Analyst, Transaction Advisory", unitId: "U-TA", grade: "Senior Analyst",
    formalManagerId: "TA-SAS-01", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Analysis", "Modeling"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["TA-GI"] }
  },
  {
    id: "TA-GF-01", code: "TA-GF-01", name: "Pollum Johnson", title: "Graduate Intern, Transaction Advisory", unitId: "U-TA", grade: "Graduate Intern",
    formalManagerId: "TA-AS-02", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Support"], notes: "", recurringRoles: [] }
  },
  {
    id: "TA-GF-02", code: "TA-GF-02", name: "Madinah Suleiman", title: "Graduate Intern, Transaction Advisory", unitId: "U-TA", grade: "Graduate Intern",
    formalManagerId: "TA-AS-02", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Support"], notes: "", recurringRoles: [] }
  },
  {
    id: "TA-GI", code: "TA-GI", name: "Fatima Abdulfattah", title: "Graduate Intern, Transaction Advisory", unitId: "U-TA", grade: "Graduate Intern",
    formalManagerId: "TA-SAN", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Support"], notes: "", recurringRoles: [] }
  },
  {
    id: "PDM-M", code: "PDM-M", name: "Musa Makinde", title: "Head, Project Delivery and Management (Manager)", unitId: "U-PDM", grade: "Manager",
    formalManagerId: "DMP", dottedManagerId: "MP",
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Project Delivery", "Management"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"], directReports: ["PDM-AN"] }
  },
  {
    id: "PDM-SAS", code: "PDM-SAS", name: "Bashir Badmus", title: "Senior Associate, Project Delivery and Management", unitId: "U-PDM", grade: "Senior Associate",
    formalManagerId: "MP", dottedManagerId: "PDM-M", // UPDATED: Reports Formally to MP (Abdul), Dotted to PDM-M (Musa)
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Project Delivery"], notes: "", recurringRoles: ["Line Manager", "Engagement Manager", "Proposal Manager"] }
  },
  {
    id: "PDM-AN", code: "PDM-AN", name: "Auwal Adamu", title: "Analyst, Project Delivery and Management", unitId: "U-PDM", grade: "Analyst",
    formalManagerId: "PDM-M", dottedManagerId: null,
    profile: { availability: "Active", capacityTarget: 4.0, capacityModifier: 10, skills: ["Project Delivery"], notes: "", recurringRoles: [] }
  }
];

// Helper to create date relative to now
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
// Helper to create future date
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

// Map existing items to new structure with Complexity
const workItems: WorkItem[] = [
  {
    id: "E-001", name: "Ogun SAPZ", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-TA",
    externalPartners: ["Ortus", "Michael"], complexity: 4,
    description: "Transaction advisory services for Ogun Special Agro-Processing Zone (SAPZ).",
    staffing: [
      { roleKey: "ED", personId: "TA-SAS-01", externalName: null },
      { roleKey: "EM", personId: "TA-GI", externalName: null },
      { roleKey: "EA", personId: "GG-AP", externalName: null },
      { roleKey: "PM", personId: "DMP", externalName: null },
    ],
    startDate: daysAgo(120), endDate: daysFromNow(180),
    createdAt: daysAgo(120), updatedAt: daysAgo(2)
  },
  {
    id: "E-002", name: "Gurku-Kabusu GIZ", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-GG",
    externalPartners: [], complexity: 3,
    description: "Technical assistance to activate Gurku-Kabusu Green Industrial Zone.",
    staffing: [
      { roleKey: "ED", personId: "GG-SAS", externalName: null },
      { roleKey: "EM", personId: "GG-GI-01", externalName: null },
      { roleKey: "TM", personId: "GG-AP", externalName: null }
    ],
    startDate: daysAgo(90), endDate: daysFromNow(90),
    createdAt: daysAgo(90), updatedAt: daysAgo(5)
  },
  {
    id: "E-003", name: "UKPACT C.O.R.E", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-TA",
    externalPartners: ["Michael", "Osayu", "Emma"], complexity: 4,
    description: "Supporting REA and REUCS.",
    staffing: [
      { roleKey: "PM", personId: "DMP", externalName: null },
      { roleKey: "ED", personId: "TA-AS-02", externalName: null },
      { roleKey: "EM", personId: "GG-AN", externalName: null },
      { roleKey: "EA", personId: "TA-SM", externalName: null },
    ],
    startDate: daysAgo(60), endDate: daysFromNow(30),
    createdAt: daysAgo(60), updatedAt: daysAgo(10)
  },
  {
    id: "E-004", name: "CPPF REUCS", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-TA",
    externalPartners: ["Michael", "Osayu"], complexity: 2,
    description: "Baseline data gathering.",
    staffing: [
        { roleKey: "PM", personId: "DMP", externalName: null },
        { roleKey: "ED", personId: "TA-AS-02", externalName: null },
        { roleKey: "EM", personId: "GG-AN", externalName: null },
        { roleKey: "EA", personId: "GG-AP", externalName: null },
    ],
    startDate: daysAgo(45), endDate: daysFromNow(15),
    createdAt: daysAgo(45), updatedAt: daysAgo(1)
  },
  {
    id: "E-005", name: "NCC", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-GG",
    externalPartners: ["D@tech", "Prime Platinum"], complexity: 5,
    description: "Generate data on energy use.",
    staffing: [
        { roleKey: "PM", personId: "DMP", externalName: null },
        { roleKey: "ED", personId: "GG-AN", externalName: null },
        { roleKey: "EM", personId: "TA-GF-02", externalName: null },
    ],
    startDate: daysAgo(30), endDate: daysFromNow(60),
    createdAt: daysAgo(30), updatedAt: daysAgo(8)
  },
  {
    id: "E-006", name: "Gudi AIP", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-TA",
    externalPartners: ["Mayowa", "Michael", "Kenneth"], complexity: 3,
    description: "Support development and management of Nasarawa Agro-Industrial Park.",
    staffing: [
        { roleKey: "PM", personId: "DMP", externalName: null },
        { roleKey: "ED", personId: "TA-SAN", externalName: null },
        { roleKey: "EM", personId: null, externalName: "Abdulmajeed Ajenifuja" },
        { roleKey: "EA", personId: "GG-AP", externalName: null }
    ],
    startDate: daysAgo(100), endDate: daysFromNow(200),
    createdAt: daysAgo(100), updatedAt: daysAgo(12)
  },
  {
    id: "E-007", name: "NASLEDS", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-GG",
    externalPartners: [], complexity: 2,
    description: "Desk review of clean cooking market.",
    staffing: [
        { roleKey: "PM", personId: "GG-AP", externalName: null },
        { roleKey: "ED", personId: "GG-AS", externalName: null },
        { roleKey: "EM", personId: "GG-GI-01", externalName: null },
        { roleKey: "EA", personId: "GG-SAS", externalName: null }
    ],
    startDate: daysAgo(20), endDate: daysFromNow(40),
    createdAt: daysAgo(20), updatedAt: daysAgo(3)
  },
  {
    id: "E-008", name: "APRI", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-GG",
    externalPartners: [], complexity: 3,
    description: "Strategic engagement for Africa Policy Research Institute.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "GG-GI-01", externalName: null },
        { roleKey: "TM", personId: "GG-AS", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    startDate: daysAgo(15), endDate: daysFromNow(15),
    createdAt: daysAgo(15), updatedAt: daysAgo(1)
  },
  {
    id: "E-009", name: "ACF Climate Investment Platform", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-GG",
    externalPartners: ["NOMAP"], complexity: 5,
    description: "Design and structuring of climate investment platform.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "TA-SM", externalName: null },
        { roleKey: "TM", personId: "GG-AP", externalName: null }
    ],
    startDate: daysAgo(10), endDate: daysFromNow(120),
    createdAt: daysAgo(10), updatedAt: daysAgo(5)
  },
  {
    id: "E-010", name: "SMDF PAGMI", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-PDM",
    externalPartners: ["Archiform"], complexity: 4,
    description: "Engineering and contract management for pilot mining.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "ED", personId: "PDM-M", externalName: null },
        { roleKey: "EM", personId: "PDM-AN", externalName: null },
        { roleKey: "EA", personId: "PDM-SAS", externalName: null }
    ],
    startDate: daysAgo(120), endDate: daysFromNow(240),
    createdAt: daysAgo(120), updatedAt: daysAgo(2)
  },
  {
    id: "E-011", name: "SMDF AMDP", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-PDM",
    externalPartners: [], complexity: 4,
    description: "Project management framework for mining.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "ED", personId: "PDM-M", externalName: null },
        { roleKey: "EM", personId: "PDM-AN", externalName: null },
        { roleKey: "EA", personId: "PDM-SAS", externalName: null }
    ],
    startDate: daysAgo(110), endDate: daysFromNow(200),
    createdAt: daysAgo(110), updatedAt: daysAgo(4)
  },
  {
    id: "E-012", name: "UKNIAF", typeId: "T-ENG", lifecycleId: "L-CUR", teamUnitId: "U-TA",
    externalPartners: [], complexity: 3,
    description: "Infrastructure advisory facility support.",
    staffing: [
        { roleKey: "PD", personId: "DMP", externalName: null },
        { roleKey: "TM", personId: "TA-SM", externalName: null }
    ],
    startDate: daysAgo(200), endDate: daysAgo(10),
    createdAt: daysAgo(200), updatedAt: daysAgo(30)
  },
  // In Discussion
  {
    id: "D-001", name: "C/River Commodity Corridor", typeId: "T-DIS", lifecycleId: "L-DIS", teamUnitId: "U-CM",
    externalPartners: [], complexity: 3, description: "Strategic corridor development discussion.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "DMP", externalName: null },
        { roleKey: "TM", personId: "PDM-M", externalName: null },
        { roleKey: "TM", personId: "GG-AP", externalName: null }
    ],
    createdAt: daysAgo(10), updatedAt: daysAgo(1)
  },
  {
    id: "D-002", name: "Akwa Ibom Electricity Market", typeId: "T-DIS", lifecycleId: "L-DIS", teamUnitId: "U-TA",
    externalPartners: [], complexity: 4, description: "Electricity market reform discussion.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "TA-SM", externalName: null },
        { roleKey: "TM", personId: "TA-SAS-02", externalName: null }
    ],
    createdAt: daysAgo(5), updatedAt: daysAgo(5)
  },
  // Live Proposals
  {
    id: "P-001", name: "ECREE", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-TA",
    externalPartners: ["NSHCDA"], complexity: 3, description: "Renewable energy proposal.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "PM", personId: "TA-SAN", externalName: null },
        { roleKey: "TM", personId: "TA-SM", externalName: null }
    ],
    createdAt: daysAgo(15), updatedAt: daysAgo(2)
  },
  {
    id: "P-002", name: "Adamawa Industrial Park", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-PDM",
    externalPartners: [], complexity: 3, description: "Industrial park proposal.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "PM", personId: "TA-AS-01", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    createdAt: daysAgo(20), updatedAt: daysAgo(3)
  },
  {
    id: "P-003", name: "Katsina GEZ and Techville", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-PDM",
    externalPartners: [], complexity: 4, description: "Green Economic Zone proposal.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "PM", personId: "TA-AS-01", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    createdAt: daysAgo(25), updatedAt: daysAgo(5)
  },
  {
    id: "P-004", name: "Ekiti Knowledge Zone", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-TA",
    externalPartners: [], complexity: 3, description: "Knowledge zone advisory.",
    staffing: [
        { roleKey: "PD", personId: "DMP", externalName: null },
        { roleKey: "PM", personId: "TA-AS-01", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    createdAt: daysAgo(30), updatedAt: daysAgo(10)
  },
  {
    id: "P-005", name: "Banjul–Barra Bridge", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-PDM",
    externalPartners: ["GIBB", "LADIOM"], complexity: 5, description: "Infrastructure bridge proposal.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "PDM-M", externalName: null }
    ],
    createdAt: daysAgo(40), updatedAt: daysAgo(15)
  },
  {
    id: "P-006", name: "Kano Transport Masterplan", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-PDM",
    externalPartners: [], complexity: 4, description: "Transport masterplan.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "PDM-M", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    createdAt: daysAgo(45), updatedAt: daysAgo(12)
  },
  {
    id: "P-007", name: "Kaduna SAPZ", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-PDM",
    externalPartners: ["NBHH"], complexity: 3, description: "SAPZ Proposal.",
    staffing: [
        { roleKey: "PD", personId: "MP", externalName: null },
        { roleKey: "TM", personId: "PDM-M", externalName: null },
        { roleKey: "TM", personId: "DMP", externalName: null }
    ],
    createdAt: daysAgo(50), updatedAt: daysAgo(20)
  },
  {
    id: "P-008", name: "BOI iDICE", typeId: "T-PRO", lifecycleId: "L-PRO", teamUnitId: "U-TA",
    externalPartners: ["Archiform (Aminu)"], complexity: 4, description: "iDICE proposal.",
    staffing: [
        { roleKey: "PD", personId: "DMP", externalName: null },
        { roleKey: "TM", personId: "TA-SAN", externalName: null },
        { roleKey: "TM", personId: "PDM-SAS", externalName: null }
    ],
    createdAt: daysAgo(10), updatedAt: daysAgo(2)
  }
];

// Generate packs for all items
const packs: Record<string, Pack> = {};
workItems.forEach(w => {
    packs[w.id] = {
        raid: [],
        raci: [],
        decisions: [],
        reports: [],
        comments: [],
        updatedAt: w.updatedAt
    };
});

export const seedV10: AppState = {
  meta: {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    org: { name: "Murty International Ltd", code: "MURTY", b3: "https://selar.com/m/b3" }
  },
  ui: {
    theme: "dark",
    view: "dash",
    activeWorkId: null,
    activePersonId: null,
    currentUser: "MP", 
    isAuthenticated: true,
    sidebarCollapsed: false,
    history: [], // Initialize history array
    filters: { lifecycleId: null, unitId: null, typeId: null, search: "" }
  },
  settings: {
    taxonomy: {
      units: [
        { id:"U-CM", name:"Central Management" },
        { id:"U-CS", name:"Corporate Services" },
        { id:"U-GG", name:"Green Growth" },
        { id:"U-TA", name:"Transaction Advisory" },
        { id:"U-PDM", name:"Project Delivery and Management" }
      ],
      lifecycle: [
        { id:"L-CUR", name:"Current Engagements" },
        { id:"L-DIS", name:"Engagements in Discussion" },
        { id:"L-CLS", name:"Closed Deals" },
        { id:"L-PRO", name:"Live Proposals" }
      ],
      workTypes: [
        { id:"T-ENG", name:"Engagement" },
        { id:"T-PRO", name:"Proposal" },
        { id:"T-DIS", name:"Discussion" }
      ],
      raid: {
        types: ["Risk","Issue","Decision","Action","Dependency"],
        status: ["Open","Blocked","Closed"],
        impact: ["High","Medium","Low"],
        probability: ["High","Medium","Low"]
      },
      roleKeys: [
        { key:"PD", name:"Proposal Director" },
        { key:"PM", name:"Proposal Manager" },
        { key:"ED", name:"Engagement Director" },
        { key:"EM", name:"Engagement Manager" },
        { key:"EA", name:"Engagement Analyst" },
        { key:"TM", name:"Team Member" },
        { key:"LM", name:"Line Manager" },
        { key:"EXT", name:"External" }
      ]
    },
    templates: {
      raciDecisionAreas: [
        "Bid / No-Bid",
        "Proposal submission sign-off",
        "Staffing & key-person allocation",
        "Budget/commercial sign-off",
        "Scope change / variation approval",
        "Deliverable QA approval (internal)",
        "Client deliverable sign-off",
        "Risk acceptance / escalation",
        "Procurement / partner onboarding",
        "Governance cadence pack sign-off"
      ]
    },
    workload: WORKLOAD_SETTINGS, // Using CSV seed data
    workloadHistory: [],
    weights: {
      // Legacy health weights
      health: {
        impactWeight: { High: 15, Medium: 8, Low: 3 },
        overduePenalty: 10,
        blockedPenalty: 20,
        missingRolePenalty: 15
      },
      reporting: {
        expectedUpdateDaysByLifecycle: { "L-CUR": 7, "L-PRO": 7, "L-DIS": 14, "L-CLS": 14 }
      }
    },
    profileFields: [
      { key:"availability", label:"Availability", type:"enum", options:["Active","Part-time","Leave","Sick","Unavailable"], default:"Active" },
      { key:"capacityTarget", label:"Capacity Target", type:"number", default:4.0 },
      { key:"skills", label:"Skills", type:"multi", options:["Governance","Feasibility","Procurement","PMO","Energy","Mining","PPP","ESIA"], default:[] },
      { key:"notes", label:"Notes", type:"text", default:"" }
    ]
  },
  people,
  workItems,
  packs,
  audit: []
};
