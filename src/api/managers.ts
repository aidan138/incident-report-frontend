// src/api/managers.ts

import { request, MANAGERS_BASE_PATH } from './client';
import type {
  ManagerRead,
  ManagerPayload,
  ManagerUpdate,
} from '../types/portal';

// GET /managers/
export function listManagers(): Promise<ManagerRead[]> {
  return request<ManagerRead[]>(`${MANAGERS_BASE_PATH}/`);
}

// POST /managers/
export function createManager(payload: ManagerPayload): Promise<ManagerRead> {
  return request<ManagerRead>(`${MANAGERS_BASE_PATH}/`, {
    method: 'POST',
    jsonBody: payload,
  });
}

// GET /managers/{id}
export function getManager(id: string): Promise<ManagerRead> {
  return request<ManagerRead>(`${MANAGERS_BASE_PATH}/${id}`);
}

// PUT /managers/{id}
export function updateManager(
  id: string,
  payload: ManagerUpdate
): Promise<ManagerRead> {
  return request<ManagerRead>(`${MANAGERS_BASE_PATH}/${id}`, {
    method: 'PUT',
    jsonBody: payload,
  });
}

// DELETE /managers/{id}
export async function deleteManager(id: string): Promise<void> {
  await request<void>(`${MANAGERS_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}
