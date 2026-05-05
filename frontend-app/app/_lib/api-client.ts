export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    session: "/api/auth/session",
  },
  chat: "/api/chat",
  chatAgents: "/api/chat/agents",
  history: "/api/history",
  documents: {
    file: "/api/documents/file",
  },
} as const;

export const getHistoryDetailRoute = (conversationId: string) =>
  `${API_ROUTES.history}/${encodeURIComponent(conversationId)}`;

export class ApiClientError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export const readApiMessage = (data: unknown, fallback: string) =>
  (data as { detail?: string; message?: string })?.detail ??
  (data as { detail?: string; message?: string })?.message ??
  fallback;

const isBodyInit = (value: unknown): value is BodyInit =>
  typeof value === "string" ||
  value instanceof Blob ||
  value instanceof FormData ||
  value instanceof URLSearchParams ||
  value instanceof ArrayBuffer ||
  ArrayBuffer.isView(value) ||
  value instanceof ReadableStream;

type JsonRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  fallbackErrorMessage?: string;
};

export async function requestJson<T>(
  url: string,
  options: JsonRequestOptions = {},
): Promise<T> {
  const { body, fallbackErrorMessage = "Không thể xử lý yêu cầu.", ...init } =
    options;

  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");

  let resolvedBody: BodyInit | undefined;
  if (body !== null && body !== undefined) {
    if (isBodyInit(body)) {
      resolvedBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      resolvedBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: resolvedBody,
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiClientError(
      readApiMessage(data, fallbackErrorMessage),
      response.status,
      data,
    );
  }

  return data as T;
}
