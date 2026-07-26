const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5208/api";

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL in .env.local");
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

/** Thrown by apiFetch on a non-ok response. Carries the real HTTP status
 * so callers can branch on it (e.g. 404 = "not found") instead of
 * string-matching the message text. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Lỗi máy chủ: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) errorMessage = body.message;
    } catch {
      // fall through to default message
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

/** Like apiFetch, but for multipart/form-data uploads. apiFetch always sets
 * Content-Type: application/json, which is wrong for FormData bodies — the
 * browser needs to set its own multipart boundary. Only Authorization is
 * set manually here; Content-Type is left for fetch to fill in. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { token?: string | null; method?: string } = {}
): Promise<T> {
  const { token, method = "POST" } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Lỗi máy chủ: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) errorMessage = body.message;
    } catch {
      // fall through to default message
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}