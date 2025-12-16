// src/api/lifeguards.ts

import { request, LIFEGUARDS_BASE_PATH } from './client';
import type {
  LifeguardRead,
  LifeguardPayload,
  LifeguardUpdate,
} from '../types/portal';

// GET /lifeguards/
export function listLifeguards(): Promise<LifeguardRead[]> {
  return request<LifeguardRead[]>(`${LIFEGUARDS_BASE_PATH}/`);
}

// POST /lifeguards/
export function createLifeguard(payload: LifeguardPayload): Promise<LifeguardRead> {
  return request<LifeguardRead>(`${LIFEGUARDS_BASE_PATH}/`, {
    method: 'POST',
    jsonBody: payload,
  });
}

// GET /lifeguards/{id}
export function getLifeguard(id: string): Promise<LifeguardRead> {
  return request<LifeguardRead>(`${LIFEGUARDS_BASE_PATH}/${id}`);
}

// GET /lifeguards/phone/{phone}
export function getLifeguardByPhone(phone: string): Promise<LifeguardRead> {
  return request<LifeguardRead>(`${LIFEGUARDS_BASE_PATH}/phone/${encodeURIComponent(phone)}`);
}

// PUT /lifeguards/{id}
export function updateLifeguard(
  id: string,
  payload: LifeguardUpdate
): Promise<LifeguardRead> {
  return request<LifeguardRead>(`${LIFEGUARDS_BASE_PATH}/${id}`, {
    method: 'PUT',
    jsonBody: payload,
  });
}

// DELETE /lifeguards/{id}
export async function deleteLifeguard(id: string): Promise<void> {
  await request<void>(`${LIFEGUARDS_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}
