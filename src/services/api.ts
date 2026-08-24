/**
 * Central API configuration. Point this at the real backend when it exists.
 *
 * Set EXPO_PUBLIC_API_URL in an .env file (see .env.example) to switch every
 * service call over to the live API. Until then services return local content
 * so the app is fully usable offline / during launch.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const hasBackend = API_BASE_URL.length > 0;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
