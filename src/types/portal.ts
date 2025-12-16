// src/types/portal.ts

// ---------- Lifeguards ----------

export interface LifeguardPayload {
  name: string;
  phone: string;     // "+1-555-000-1111" etc.
  region_id: string; // region UUID
}

export interface LifeguardUpdate {
  name?: string;
  phone?: string;
  region_id?: string;
}

export interface LifeguardRead {
  pk: string;        // UUID
  id: string;        // computed_field in Pydantic
  name: string;
  phone: string;
  region_id: string;
  created: string;   // ISO datetime
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

// Request payload for creation
export interface RegionPayload extends RegionBase {
  managers?: string[];  // manager names
}

// Request payload for update
export interface RegionUpdate {
  slug?: string;
  locations?: Record<string, string>;
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
  region_slugs?: string[];
}

export interface ManagerUpdate {
  name?: string;
  email?: string;
}

export interface ManagerRead {
  pk: string;
  name: string;
  email: string;
  regions: RegionSummary[];
  id: string;
  created: string;
}
