export type Citation = {
  id: string;
  title: string;
  source_url: string | null;
  available: boolean;
  category: string | null;
  filename: string | null;
  media_type: string | null;
  download_url: string | null;
};

const CITATION_BLOCK_PATTERN =
  /<!--\s*CITATIONS_START\s*-->[\s\S]*?<!--\s*CITATIONS_END\s*-->\s*/gi;

export const stripCitationBlock = (rawText: string): string =>
  rawText.replace(CITATION_BLOCK_PATTERN, "").trimEnd();

const isCitation = (value: unknown): value is Citation => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.available === "boolean"
  );
};

export const normalizeCitations = (value: unknown): Citation[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: Citation[] = [];

  for (const item of value) {
    if (!isCitation(item)) {
      continue;
    }
    const key = `${item.id}::${item.title}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({
      id: item.id,
      title: item.title,
      source_url: typeof item.source_url === "string" ? item.source_url : null,
      available: Boolean(item.available),
      category: typeof item.category === "string" ? item.category : null,
      filename: typeof item.filename === "string" ? item.filename : null,
      media_type: typeof item.media_type === "string" ? item.media_type : null,
      download_url:
        typeof item.download_url === "string" ? item.download_url : null,
    });
  }

  return result;
};

export const getCitationDocumentUrl = (citation: Citation): string =>
  `/api/documents/file?citation_id=${encodeURIComponent(citation.id)}`;

export const getCitationDownloadUrl = (citation: Citation): string =>
  `/api/documents/file?citation_id=${encodeURIComponent(citation.id)}&inline=false`;
