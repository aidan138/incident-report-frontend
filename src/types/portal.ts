// src/types/portal.ts

// ---------- Lifeguards ----------

export interface LifeguardPayload {
  name: string;
  phone: string;     // "+1-555-000-1111" etc.
  region: string;    // region slug
}

export interface Lifeguard extends LifeguardPayload {
  pk: string;        // UUID
  created: string;   // ISO datetime

  // computed_field in Pydantic -> exposed as id
  id: string;
}


// ---------- Simple helper types ----------

export interface RegionSummary {
  pk: string;
  slug: string;
  locations: Record<string, string>;

  id: string;
}

export interface ManagerSummary {
  pk: string;
  name: string;
  email: string;

  id: string;
}


// ---------- Regions ----------

export interface RegionBase {
  slug: string;
  locations: Record<string, string>;
}

// Request payload: managers as names
export interface RegionPayload extends RegionBase {
  managers?: string[];  // manager names
}

export interface RegionLocationUpdate {
  locations: Record<string, string>;
}

// Response: managers as full objects
export interface RegionRead extends RegionBase {
  pk: string;
  id: string;
  created: string;
  managers: ManagerSummary[];
}


// ---------- Managers ----------

export interface ManagerPayload {
  name: string;
  email: string;
  region_slugs: string[];
}

export interface ManagerUpdate {
  email?: string;
}

export interface ManagerRead {
  pk: string;
  name: string;
  email: string;
  regions: RegionSummary[];
  id: string;
}
