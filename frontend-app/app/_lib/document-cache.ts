/**
 * Document cache & streaming downloader for citation previews.
 *
 * The native Chrome PDF viewer downloads a PDF twice when the response
 * does not advertise robust range support (once for the iframe load and
 * once for the embedded PDF.js worker). Pre-fetching the bytes ourselves
 * and feeding the viewer a `blob:` URL avoids that round-trip and lets
 * us surface real download progress in the UI.
 *
 * The cache is a tiny in-memory LRU keyed by citation id so reopening the
 * same source is instant within a session. Blob URLs are revoked on
 * eviction to keep memory usage bounded.
 */
export type DocumentCacheEntry = {
  url: string;
  contentType: string;
  size: number;
};

export type DocumentDownloadProgress = {
  /** Bytes received so far. Always available. */
  loaded: number;
  /** Total size when known (Content-Length). May be 0 when unknown. */
  total: number;
  /** Convenience ratio in [0, 1]. Falls back to 0 when total is unknown. */
  ratio: number;
};

const MAX_CACHE_ENTRIES = 5;

const cache = new Map<string, DocumentCacheEntry>();

const evictIfNeeded = () => {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    const oldest = cache.get(oldestKey);
    if (oldest) {
      try {
        URL.revokeObjectURL(oldest.url);
      } catch {
        // Revoking a URL that was never created (or already revoked) is
        // safe to ignore.
      }
    }
    cache.delete(oldestKey);
  }
};

export const getCachedDocument = (
  cacheKey: string,
): DocumentCacheEntry | undefined => {
  const entry = cache.get(cacheKey);
  if (!entry) {
    return undefined;
  }
  // Re-insert to move the entry to the most-recently-used position.
  cache.delete(cacheKey);
  cache.set(cacheKey, entry);
  return entry;
};

export const setCachedDocument = (
  cacheKey: string,
  entry: DocumentCacheEntry,
): void => {
  const previous = cache.get(cacheKey);
  if (previous && previous.url !== entry.url) {
    try {
      URL.revokeObjectURL(previous.url);
    } catch {
      // No-op
    }
  }
  cache.delete(cacheKey);
  cache.set(cacheKey, entry);
  evictIfNeeded();
};

export const clearDocumentCache = (): void => {
  for (const entry of cache.values()) {
    try {
      URL.revokeObjectURL(entry.url);
    } catch {
      // No-op
    }
  }
  cache.clear();
};

type DownloadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: DocumentDownloadProgress) => void;
  fallbackContentType?: string;
};

export class DocumentDownloadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DocumentDownloadError";
    this.status = status;
  }
}

/**
 * Downloads `url` while reporting incremental progress and returns a
 * cached blob URL. Re-uses an in-flight result when the same `cacheKey`
 * is requested concurrently is left to the caller — the cache hit path
 * in `getCachedDocument` covers the common "open the same citation
 * twice" case.
 */
export const downloadDocument = async (
  cacheKey: string,
  url: string,
  options: DownloadOptions = {},
): Promise<DocumentCacheEntry> => {
  const cached = getCachedDocument(cacheKey);
  if (cached) {
    options.onProgress?.({
      loaded: cached.size,
      total: cached.size,
      ratio: 1,
    });
    return cached;
  }

  const response = await fetch(url, {
    signal: options.signal,
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new DocumentDownloadError(
      `Không thể tải tài liệu (HTTP ${response.status}).`,
      response.status,
    );
  }

  const contentType =
    response.headers.get("content-type") ??
    options.fallbackContentType ??
    "application/octet-stream";
  const totalHeader = response.headers.get("content-length");
  const total = totalHeader ? Number.parseInt(totalHeader, 10) : 0;

  // Emit a "0 of N" progress event as soon as headers arrive so the UI
  // can distinguish "still waiting on the server" from "bytes are
  // actually flowing now". Without this signal, the loader can't tell
  // whether the long pause is network/auth/middleware (TTFB) or just a
  // big file streaming through.
  options.onProgress?.({
    loaded: 0,
    total,
    ratio: 0,
  });

  if (!response.body) {
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const entry: DocumentCacheEntry = {
      url: objectUrl,
      contentType,
      size: blob.size,
    };
    setCachedDocument(cacheKey, entry);
    options.onProgress?.({
      loaded: blob.size,
      total: blob.size,
      ratio: 1,
    });
    return entry;
  }

  const reader = response.body.getReader();
  // The Blob constructor's `BlobPart[]` does not narrowly accept the
  // `Uint8Array<ArrayBufferLike>` flavor that TS 5.7+ infers from the
  // streaming reader, so we keep the chunks behind the wider `BlobPart`
  // type here. Each chunk is still a real `Uint8Array` at runtime.
  const chunks: BlobPart[] = [];
  let loaded = 0;

  // Throttle progress updates to one per animation frame so we don't
  // overwhelm React with state updates on big files.
  let lastProgressAt = 0;
  const flushProgress = (force: boolean) => {
    if (!options.onProgress) {
      return;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - lastProgressAt < 80) {
      return;
    }
    lastProgressAt = now;
    options.onProgress({
      loaded,
      total,
      ratio: total > 0 ? Math.min(1, loaded / total) : 0,
    });
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value as BlobPart);
      loaded += value.byteLength;
      flushProgress(false);
    }
  }

  flushProgress(true);

  const blob = new Blob(chunks, { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const entry: DocumentCacheEntry = {
    url: objectUrl,
    contentType,
    size: blob.size,
  };
  setCachedDocument(cacheKey, entry);
  return entry;
};
