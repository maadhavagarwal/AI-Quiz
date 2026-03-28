// API utility functions for frontend

const API_CANDIDATES = [
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:9876/api',
  'http://localhost:9877/api',
  'http://localhost:9878/api',
  'http://localhost:9879/api',
  'http://localhost:9880/api',
  'http://localhost:9881/api',
  'http://localhost:9882/api',
  'http://localhost:9883/api',
  'http://localhost:9884/api',
  'http://localhost:9885/api',
  'http://localhost:5000/api',
].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value as string) === index);

let resolvedApiUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (resolvedApiUrl) {
    return resolvedApiUrl;
  }

  for (const candidate of API_CANDIDATES) {
    try {
      const response = await fetch(`${candidate}/health`, { method: 'GET' });
      if (response.ok) {
        resolvedApiUrl = candidate;
        return candidate;
      }
    } catch {
      // Try next candidate.
    }
  }

  // Fall back to first configured candidate so error messages are still meaningful.
  resolvedApiUrl = API_CANDIDATES[0] || 'http://localhost:9876/api';
  return resolvedApiUrl;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

function shouldAttachAuthToken(endpoint: string): boolean {
  // Public test-link endpoints should not require auth and avoiding Authorization
  // prevents unnecessary CORS preflight failures for guest users.
  return !endpoint.startsWith('/tests/');
}

async function executeJsonRequest(url: string, config: FetchOptions): Promise<any> {
  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return await response.json();
}

export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (shouldAttachAuthToken(endpoint)) {
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: FetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  let apiBase = await getApiBaseUrl();
  let url = `${apiBase}${endpoint}`;

  try {
    return await executeJsonRequest(url, config);
  } catch (error) {
    console.error('API call failed:', error);

    // Browser fetch throws TypeError for network/CORS/mixed-content failures.
    if (error instanceof TypeError) {
      // Backend port may have auto-shifted; clear cache and resolve again once.
      resolvedApiUrl = null;
      apiBase = await getApiBaseUrl();
      url = `${apiBase}${endpoint}`;

      try {
        return await executeJsonRequest(url, config);
      } catch (retryError) {
        throw new Error(
          `Unable to reach backend at ${apiBase}. Check that backend is running and CORS allows this frontend origin.`
        );
      }
    }

    throw error;
  }
}

export async function uploadFile(file: File, endpoint: string) {
  const apiBase = await getApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBase}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response.json();
}
