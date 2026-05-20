// Domain models for the Malaysia AI Infrastructure dashboard.
// Sources are tagged "verified" or "placeholder" so non-validated figures
// can be surfaced in the UI and upgraded as primary sources are confirmed.

export type SourceTag = "verified" | "placeholder";

export type ProjectStatus =
  | "operational"
  | "under_construction"
  | "committed"
  | "planned"
  | "early_stage";

export type Region = "Johor" | "Greater KL" | "Selangor" | "Penang" | "Other";

export type Country =
  | "US"
  | "China"
  | "Malaysia"
  | "Singapore"
  | "Japan"
  | "UAE"
  | "Other";

export interface Operator {
  id: string;
  name: string;
  country: Country;
  type: "hyperscaler" | "colocation" | "neocloud" | "telco" | "sovereign";
}

export interface DataCenter {
  id: string;
  name: string;
  operatorId: string;
  region: Region;
  lat: number;
  lng: number;
  capacityMW: number;
  capexUSD_MM: number; // millions USD
  status: ProjectStatus;
  announcedYear: number;
  expectedOnlineYear: number | null;
  primaryFinancierId: string;
  jobsCreated: number | null;
  source: SourceTag;
  notes?: string;
}

export type FinancingStructure =
  | "100% equity"
  | "JV"
  | "equity + project debt"
  | "build-to-suit lease"
  | "sale-leaseback"
  | "infra fund";

export interface Financier {
  id: string;
  name: string;
  country: Country;
  category:
    | "US hyperscaler"
    | "US private equity"
    | "sovereign wealth"
    | "Asian conglomerate"
    | "Malaysian state"
    | "infrastructure fund"
    | "REIT";
}

export interface Investment {
  id: string;
  projectId: string; // datacenter id
  financierId: string;
  amountUSD_MM: number;
  structure: FinancingStructure;
  equityPct: number;
  debtPct: number;
  announcedDate: string; // ISO
  status: "announced" | "signed" | "funded" | "operational";
  source: SourceTag;
}

export interface CapacityPoint {
  year: number;
  liveMW: number;
  underConstructionMW: number;
  committedMW: number;
  source: SourceTag;
}

export interface TimelineEvent {
  date: string; // ISO yyyy-mm-dd
  type: "investment" | "policy" | "tariff" | "geopolitical" | "infrastructure";
  title: string;
  body: string;
  source: SourceTag;
}

export interface SankeyNode {
  id: string;
  label: string;
  group: "source" | "vehicle" | "destination";
}

export interface SankeyLink {
  sourceId: string;
  targetId: string;
  valueUSD_MM: number;
}

export interface RiskScores {
  country: string;
  cost: number; // 0-10, higher = better/cheaper
  power: number;
  talent: number;
  political: number;
  water: number;
  regulatory: number;
}
