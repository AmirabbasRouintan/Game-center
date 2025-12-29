async function apiRequest<T>(
  method: 'GET' | 'POST',
  key: string,
  data?: unknown,
): Promise<T | null> {
  try {
    let url = `/api/db?key=${encodeURIComponent(key)}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST') {
      url = '/api/db'; // POST uses body
      options.body = JSON.stringify({ key, data });
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      console.error(`API Error ${res.status}: ${res.statusText}`);
      return null;
    }
    const json = await res.json();
    return json as T;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

export async function loadFromApi<T>(key: string, fallback: T): Promise<T> {
  const data = await apiRequest<T>('GET', key);
  return data ?? fallback;
}

export async function saveToApi<T>(key: string, value: T): Promise<void> {
  await apiRequest('POST', key, value);
}

// Fallback helpers (deprecated but kept if needed for transition)
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Backwards-compatible LocalStorage helpers used by some stores.
 * Safe to import in SSR because they guard `window` access.
 */
export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return safeJsonParse<T>(window.localStorage.getItem(key), fallback);
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/serialization errors
  }
}