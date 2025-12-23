// src/api/client.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// Adjust these if your routers are mounted at different paths
export const REGIONS_BASE_PATH = '/regions';
export const MANAGERS_BASE_PATH = '/managers';
export const LIFEGUARDS_BASE_PATH = '/lifeguards';
export const INCIDENTS_BASE_PATH = '/incident';

interface RequestOptions extends RequestInit {
  jsonBody?: unknown;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const init: RequestInit = {
    ...options,
    headers,
    body:
      options.jsonBody !== undefined
        ? JSON.stringify(options.jsonBody)
        : options.body,
  };

  const response = await fetch(url, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg ?? d).join(', ')
          : data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  // For 204 No Content or empty response
  if (response.status === 204) {
    // @ts-expect-error: T can be void
    return undefined;
  }

  // Assume JSON for other cases
  return response.json() as Promise<T>;
}
