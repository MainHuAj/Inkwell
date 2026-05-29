// Thin client-side fetch wrapper that unwraps our structured JSON envelope
// ({ success, data } | { success, error }) and throws a friendly Error on
// failure so callers can surface error.message directly in a toast.

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  const body = json as
    | { success: true; data: T }
    | { success: false; error: { message: string; details?: unknown } }
    | null;

  if (!res.ok || !body || body.success === false) {
    const message =
      body && body.success === false
        ? body.error.message
        : "Something went wrong. Please try again.";
    const details = body && body.success === false ? body.error.details : undefined;
    throw new ApiError(message, res.status, details);
  }

  return body.data;
}
