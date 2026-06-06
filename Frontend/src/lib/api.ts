const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL in .env.local");
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

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
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}