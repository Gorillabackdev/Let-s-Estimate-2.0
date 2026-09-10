/**
 * Safe API request helper to prevent JSON parsing crashes and network errors.
 * Ensures the response is verified as JSON before parsing, preventing
 * "Unexpected token '<', '<!doctype '... is not valid JSON" and unhandled "Failed to fetch" errors.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeParseJson<T = any>(
  res: Response
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: `Server returned non-JSON response (${res.status})`,
      };
    }
    const data = await res.json();
    return {
      ok: res.ok,
      data,
      error: !res.ok ? (data?.error || `Request failed with status ${res.status}`) : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Failed to parse server response',
    };
  }
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const parsed = await safeParseJson<T>(res);

    return {
      ok: parsed.ok,
      status: res.status,
      data: parsed.data,
      error: parsed.error,
    };
  } catch (err: any) {
    // Gracefully handle network disconnection or server restart ("Failed to fetch")
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network connection unavailable. Please retry.',
    };
  }
}
