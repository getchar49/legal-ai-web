export type ChatAgent = {
  agent_id: string;
  name: string;
  description: string;
  inference_mode: string;
  is_default: boolean;
};

type ChatAgentCatalogApiResponse = {
  default_agent_id?: string;
  items?: unknown[];
};

type ChatAgentCatalogCache = {
  expiresAt: number;
  value: {
    items: ChatAgent[];
    defaultAgentId: string;
  };
};

const CHAT_AGENT_CACHE_TTL_MS = 5 * 60 * 1000;
const CHAT_AGENT_CACHE_STORAGE_KEY = "chat-agent-catalog-v1";

let inMemoryCache: ChatAgentCatalogCache | null = null;
let inflightRequest: Promise<ChatAgentCatalogCache["value"]> | null = null;

const normalizeAgent = (input: unknown): ChatAgent | null => {
  const candidate = input as Record<string, unknown>;
  const agentId = typeof candidate.agent_id === "string" ? candidate.agent_id : "";
  if (!agentId) {
    return null;
  }

  return {
    agent_id: agentId,
    name: typeof candidate.name === "string" ? candidate.name : agentId,
    description:
      typeof candidate.description === "string" ? candidate.description : "",
    inference_mode:
      typeof candidate.inference_mode === "string" ? candidate.inference_mode : "",
    is_default: Boolean(candidate.is_default),
  };
};

const readSessionCache = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CHAT_AGENT_CACHE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ChatAgentCatalogCache;
    if (!parsed || typeof parsed.expiresAt !== "number" || !parsed.value) {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CHAT_AGENT_CACHE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeSessionCache = (cacheValue: ChatAgentCatalogCache) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(
    CHAT_AGENT_CACHE_STORAGE_KEY,
    JSON.stringify(cacheValue),
  );
};

const normalizeCatalogResponse = (payload: ChatAgentCatalogApiResponse) => {
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items = rawItems
    .map((item) => normalizeAgent(item))
    .filter((item): item is ChatAgent => item !== null);

  const defaultFromApi =
    typeof payload.default_agent_id === "string" ? payload.default_agent_id : "";
  const fallbackDefault =
    items.find((item) => item.is_default)?.agent_id ?? items[0]?.agent_id ?? "";
  const defaultAgentId = defaultFromApi || fallbackDefault;

  return {
    items,
    defaultAgentId,
  };
};

type ReadChatAgentCatalogOptions = {
  forceRefresh?: boolean;
};

export const clearChatAgentCatalogCache = () => {
  inMemoryCache = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CHAT_AGENT_CACHE_STORAGE_KEY);
  }
};

export async function readChatAgentCatalog(
  fetcher: () => Promise<ChatAgentCatalogApiResponse>,
  options: ReadChatAgentCatalogOptions = {},
) {
  const forceRefresh = options.forceRefresh ?? false;
  const now = Date.now();

  if (!forceRefresh && inMemoryCache && inMemoryCache.expiresAt > now) {
    return inMemoryCache.value;
  }

  if (!forceRefresh) {
    const cachedFromSession = readSessionCache();
    if (cachedFromSession) {
      inMemoryCache = cachedFromSession;
      return cachedFromSession.value;
    }
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const response = await fetcher();
    const value = normalizeCatalogResponse(response);
    const cacheValue: ChatAgentCatalogCache = {
      value,
      expiresAt: Date.now() + CHAT_AGENT_CACHE_TTL_MS,
    };
    inMemoryCache = cacheValue;
    writeSessionCache(cacheValue);
    return value;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}
