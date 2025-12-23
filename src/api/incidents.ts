// src/api/incidents.ts

import { request, INCIDENTS_BASE_PATH } from './client';
import type { IncidentSummary } from '../types/portal';

// GET /incident/
export function listIncidents(): Promise<IncidentSummary[]> {
  return request<IncidentSummary[]>(`${INCIDENTS_BASE_PATH}/`);
}

// DELETE /incident/{incident_id}
export async function deleteIncident(id: string): Promise<void> {
  await request<void>(`${INCIDENTS_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}
