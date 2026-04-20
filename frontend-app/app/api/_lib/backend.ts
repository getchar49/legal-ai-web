const DEFAULT_BACKEND_BASE_URL = "http://localhost:8000";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const BACKEND_ENDPOINTS = {
  login: "/api/login",
  register: "/api/register",
  chat: "/api/chat",
  chatAgents: "/api/chat/agents",
  history: "/api/history",
  historyDetail: (conversationId: string) =>
    `/api/history/${encodeURIComponent(conversationId)}`,
} as const;

export const getBackendBaseUrl = () =>
  process.env.BACKEND_BASE_URL ?? DEFAULT_BACKEND_BASE_URL;

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
};

type BackendHeadersOptions = {
  token?: string;
  accept?: string;
  contentType?: string;
};

export const createBackendHeaders = ({
  token,
  accept = "application/json",
  contentType,
}: BackendHeadersOptions = {}) => {
  const headers: Record<string, string> = {
    Accept: accept,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const readErrorMessage = async (response: Response) => {
  const fallbackMessage = "Không thể xử lý yêu cầu.";

  try {
    const data: unknown = await response.json();
    const detail = (data as { detail?: string; message?: string })?.detail;
    const message = (data as { detail?: string; message?: string })?.message;
    return detail ?? message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};
