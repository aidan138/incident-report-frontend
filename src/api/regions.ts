// src/api/regions.ts

import { request, REGIONS_BASE_PATH } from './client';
import type {
  RegionRead,
  RegionPayload,
  RegionUpdate,
  RegionLocationUpdate,
} from '../types/portal';

// GET /regions/
export function listRegions(): Promise<RegionRead[]> {
  return request<RegionRead[]>(`${REGIONS_BASE_PATH}/`);
}

// POST /regions/
export function createRegion(payload: RegionPayload): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/`, {
    method: 'POST',
    jsonBody: payload,
  });
}

// GET /regions/{id}
export function getRegion(id: string): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/${id}`);
}

// PUT /regions/{id} - Full region update
export function updateRegion(
  id: string,
  payload: RegionUpdate
): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/${id}`, {
    method: 'PUT',
    jsonBody: payload,
  });
}

// PATCH /regions/{id}/update-locations
export function updateRegionLocations(
  id: string,
  payload: RegionLocationUpdate
): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/${id}/update-locations`, {
    method: 'PATCH',
    jsonBody: payload,
  });
}

// DELETE /regions/{id}
export async function deleteRegion(id: string): Promise<void> {
  await request<void>(`${REGIONS_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}

// POST /regions/{region_id}/managers/{manager_id} - Assign manager to region
export function assignManagerToRegion(
  regionId: string,
  managerId: string
): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/${regionId}/managers/${managerId}`, {
    method: 'POST',
  });
}

// DELETE /regions/{region_id}/managers/{manager_id} - Unassign manager from region
export function unassignManagerFromRegion(
  regionId: string,
  managerId: string
): Promise<RegionRead> {
  return request<RegionRead>(`${REGIONS_BASE_PATH}/${regionId}/managers/${managerId}`, {
    method: 'DELETE',
  });
}
