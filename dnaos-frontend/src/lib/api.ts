const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.error === "string"
        ? errorBody.error
        : `API request failed: ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
