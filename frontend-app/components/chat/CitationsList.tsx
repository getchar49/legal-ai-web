"use client";

import type { Citation } from "@/app/_lib/citations";

type CitationsListProps = {
  citations: Citation[];
  activeCitationId?: string | null;
  onOpen: (citation: Citation) => void;
};

const formatCategory = (citation: Citation): string => {
  if (!citation.category) {
    return "";
  }
  return citation.category
    .replace(/^\s*\d+\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
};

const buildItemSubtitle = (citation: Citation): string | null => {
  const segments: string[] = [];
  const category = formatCategory(citation);
  if (category) {
    segments.push(category);
  }
  if (citation.filename) {
    segments.push(citation.filename);
  }
  if (segments.length === 0) {
    return null;
  }
  return segments.join(" · ");
};

export default function CitationsList({
  citations,
  activeCitationId,
  onOpen,
}: CitationsListProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-outline-variant/30 pt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <span
          aria-hidden
          className="material-symbols-outlined text-sm text-on-surface-variant"
        >
          format_quote
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/80">
          Nguồn tham khảo
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {citations.map((citation, index) => {
          const isActive = activeCitationId === citation.id;
          const subtitle = buildItemSubtitle(citation);
          const baseClassName =
            "group flex w-full max-w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors";
          const stateClassName = !citation.available
            ? "border-outline-variant/30 bg-surface-container-low text-on-surface-variant/60 cursor-not-allowed"
            : isActive
              ? "border-primary bg-primary-container/30 text-on-surface"
              : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:border-primary/60 hover:bg-surface-container";

          const content = (
            <>
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-headline text-sm font-semibold leading-tight">
                  {citation.title || citation.id}
                </span>
                {subtitle ? (
                  <span className="mt-0.5 truncate text-[11px] leading-tight text-on-surface-variant">
                    {subtitle}
                  </span>
                ) : null}
                {!citation.available ? (
                  <span className="mt-0.5 text-[11px] italic text-on-surface-variant/70">
                    Tài liệu không có sẵn
                  </span>
                ) : null}
              </span>
              {citation.available ? (
                <span
                  aria-hidden
                  className="material-symbols-outlined ml-1 text-sm text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                >
                  arrow_forward
                </span>
              ) : null}
            </>
          );

          return (
            <li key={`${citation.id}-${index}`} className="max-w-full">
              <button
                type="button"
                disabled={!citation.available}
                onClick={() => {
                  if (citation.available) {
                    onOpen(citation);
                  }
                }}
                aria-pressed={isActive}
                title={
                  citation.available
                    ? "Xem tài liệu trích dẫn"
                    : "Tài liệu không có sẵn"
                }
                className={`${baseClassName} ${stateClassName} min-h-16`}
              >
                {content}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
