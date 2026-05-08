"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Citation,
  getCitationDocumentUrl,
  getCitationDownloadUrl,
} from "@/app/_lib/citations";
import {
  DocumentDownloadError,
  downloadDocument,
  getCachedDocument,
  type DocumentDownloadProgress,
} from "@/app/_lib/document-cache";

type CitationPanelProps = {
  citation: Citation | null;
  onClose: () => void;
};

type PreviewStatus = "idle" | "loading" | "ready" | "error";

const isPdf = (mediaType: string | null | undefined) =>
  typeof mediaType === "string" && mediaType.toLowerCase().includes("pdf");

const isImage = (mediaType: string | null | undefined) =>
  typeof mediaType === "string" && mediaType.toLowerCase().startsWith("image/");

const inferMediaTypeFromFilename = (
  filename: string | null | undefined,
): string | null => {
  if (!filename) {
    return null;
  }
  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lowerName.endsWith(".png")) {
    return "image/png";
  }
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }
  if (lowerName.endsWith(".gif")) {
    return "image/gif";
  }
  return null;
};

const buildSubtitle = (citation: Citation): string | null => {
  const segments: string[] = [];
  if (citation.category) {
    segments.push(citation.category.replace(/^\s*\d+\.\s*/, "").trim());
  }
  if (citation.filename) {
    segments.push(citation.filename);
  }
  return segments.length > 0 ? segments.join(" · ") : null;
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, exponent);
  const decimals = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
};

type ResolvedPreview = {
  /** Mime type used by the preview decision (always defined). */
  mediaType: string;
  /** True when the resolved mime type is a renderable PDF. */
  canPreviewPdf: boolean;
  /** True when the resolved mime type is a renderable image. */
  canPreviewImage: boolean;
  /** True when we *know* the mime type but cannot render it inline. */
  showsAsUnsupported: boolean;
};

const resolvePreview = (citation: Citation): ResolvedPreview => {
  const resolvedMediaType =
    citation.media_type ?? inferMediaTypeFromFilename(citation.filename);
  const mediaType = resolvedMediaType ?? "application/pdf";
  const canPreviewPdf = isPdf(mediaType);
  const canPreviewImage = isImage(mediaType);
  return {
    mediaType,
    canPreviewPdf,
    canPreviewImage,
    showsAsUnsupported:
      Boolean(resolvedMediaType) && !canPreviewPdf && !canPreviewImage,
  };
};

/**
 * Initial state derived purely from the citation prop. The parent keys
 * the panel by `citation.id` so this initializer runs once per citation
 * — no need to reset state inside an effect.
 */
const computeInitialState = (
  citation: Citation,
  preview: ResolvedPreview,
): {
  status: PreviewStatus;
  blobUrl: string | null;
  size: number;
} => {
  if (!citation.available) {
    return { status: "idle", blobUrl: null, size: 0 };
  }
  if (preview.showsAsUnsupported) {
    return { status: "idle", blobUrl: null, size: 0 };
  }
  const cached = getCachedDocument(citation.id);
  if (cached) {
    return { status: "ready", blobUrl: cached.url, size: cached.size };
  }
  return { status: "loading", blobUrl: null, size: 0 };
};

export default function CitationPanel({ citation, onClose }: CitationPanelProps) {
  // The parent always renders this component with `citation` set and
  // remounts it via `key={citation.id}` whenever it changes, so we can
  // treat the prop as stable for the lifetime of this instance.
  if (!citation) {
    return null;
  }

  return <CitationPanelInner citation={citation} onClose={onClose} />;
}

type CitationPanelInnerProps = {
  citation: Citation;
  onClose: () => void;
};

function CitationPanelInner({ citation, onClose }: CitationPanelInnerProps) {
  const preview = useMemo(() => resolvePreview(citation), [citation]);

  const initial = useMemo(
    () => computeInitialState(citation, preview),
    [citation, preview],
  );

  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(
    initial.status,
  );
  const [previewError, setPreviewError] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string | null>(initial.blobUrl);
  const [progress, setProgress] = useState<DocumentDownloadProgress>({
    loaded: initial.size,
    total: initial.size,
    ratio: initial.size > 0 ? 1 : 0,
  });
  // Iframe load is a separate stage from the download itself — once the
  // blob is ready we still wait briefly for the embedded viewer to paint
  // its first frame before tearing down the loading overlay.
  const [isIframeReady, setIsIframeReady] = useState(false);

  const documentUrl = useMemo(() => getCitationDocumentUrl(citation), [citation]);
  const downloadUrl = useMemo(() => getCitationDownloadUrl(citation), [citation]);

  useEffect(() => {
    if (initial.status !== "loading") {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const entry = await downloadDocument(citation.id, documentUrl, {
          signal: controller.signal,
          fallbackContentType: preview.mediaType,
          onProgress: (next) => {
            if (controller.signal.aborted) {
              return;
            }
            setProgress(next);
          },
        });
        if (controller.signal.aborted) {
          return;
        }
        setBlobUrl(entry.url);
        setProgress({ loaded: entry.size, total: entry.size, ratio: 1 });
        setPreviewStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof DocumentDownloadError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Không thể tải tài liệu, vui lòng thử lại.";
        setPreviewError(message);
        setPreviewStatus("error");
      }
    })();

    return () => {
      controller.abort();
    };
  }, [citation.id, documentUrl, initial.status, preview.mediaType]);

  const subtitle = buildSubtitle(citation);
  const showLoadingOverlay =
    citation.available &&
    !preview.showsAsUnsupported &&
    (previewStatus === "loading" ||
      (previewStatus === "ready" && !isIframeReady));
  const showErrorState = citation.available && previewStatus === "error";
  const isProgressDeterminate = progress.total > 0;
  const progressPercent = isProgressDeterminate
    ? Math.min(99, Math.round(progress.ratio * 100))
    : 0;
  const loadedLabel = formatBytes(progress.loaded);
  const totalLabel = isProgressDeterminate ? formatBytes(progress.total) : null;

  // Three loader phases:
  //   1. `awaiting`   — request sent, headers not yet received. This is
  //      the period dominated by TTFB (auth, middleware, server-side
  //      buffering before the first byte ships).
  //   2. `streaming`  — bytes are arriving from the server.
  //   3. `rendering`  — bytes are local; the embedded viewer is parsing.
  const loaderPhase: "awaiting" | "streaming" | "rendering" =
    previewStatus === "ready" && !isIframeReady
      ? "rendering"
      : progress.loaded > 0 || progress.total > 0
        ? "streaming"
        : "awaiting";

  return (
    <aside
      role="complementary"
      aria-label="Xem tài liệu trích dẫn"
      className="flex h-full w-full flex-col bg-surface-container-low"
    >
      <header className="flex items-start gap-3 border-b border-outline-variant/30 bg-surface-container-low px-3 py-3 sm:px-4">
        <span
          aria-hidden
          className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <span className="material-symbols-outlined text-base">
            description
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant/70">
            Nguồn
          </p>
          <h2
            className="truncate font-headline text-sm font-semibold text-on-surface sm:text-base"
            title={citation.title}
          >
            {citation.title || citation.id}
          </h2>
          {subtitle ? (
            <p
              className="mt-0.5 truncate text-[11px] text-on-surface-variant sm:text-xs"
              title={subtitle}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span aria-hidden className="material-symbols-outlined">
            close
          </span>
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 bg-surface-container-low px-3 py-2 sm:px-4">
        <a
          href={downloadUrl}
          download={citation.filename ?? undefined}
          aria-disabled={!citation.available}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-[13px] ${
            citation.available
              ? "border-outline-variant/40 text-on-surface hover:border-primary/60 hover:bg-surface-container hover:text-primary"
              : "pointer-events-none border-outline-variant/30 text-on-surface-variant/60"
          }`}
        >
          <span aria-hidden className="material-symbols-outlined text-sm">
            download
          </span>
          Tải xuống
        </a>
        {citation.available ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary/60 hover:bg-surface-container hover:text-primary sm:text-[13px]"
          >
            <span aria-hidden className="material-symbols-outlined text-sm">
              open_in_new
            </span>
            Mở tab mới
          </a>
        ) : null}
        <span className="hidden truncate text-[11px] text-on-surface-variant/70 sm:ml-auto sm:inline">
          ID: {citation.id}
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden bg-surface-container">
        {!citation.available ? (
          <EmptyState
            icon="folder_off"
            title="Tài liệu không có sẵn"
            description="Hệ thống chưa lưu tài liệu cho trích dẫn này."
          />
        ) : showErrorState ? (
          <EmptyState
            icon="error"
            title="Không thể tải tài liệu"
            description={previewError || "Không thể tải tài liệu, vui lòng thử lại."}
            tone="error"
          />
        ) : preview.showsAsUnsupported ? (
          <UnsupportedPreview
            filename={citation.filename}
            downloadUrl={downloadUrl}
          />
        ) : (
          <>
            {preview.canPreviewPdf && blobUrl ? (
              <iframe
                key={blobUrl}
                src={blobUrl}
                title={citation.title}
                className="h-full w-full border-0 bg-white"
                onLoad={() => {
                  setIsIframeReady(true);
                }}
                onError={() => {
                  setPreviewError("Không thể hiển thị tài liệu PDF.");
                  setPreviewStatus("error");
                }}
              />
            ) : null}

            {preview.canPreviewImage && blobUrl ? (
              <div className="h-full w-full overflow-auto bg-surface-container p-3 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blobUrl}
                  alt={citation.title}
                  className="mx-auto block max-h-full max-w-full rounded-md"
                  onLoad={() => {
                    setIsIframeReady(true);
                  }}
                  onError={() => {
                    setPreviewError("Không thể hiển thị hình ảnh.");
                    setPreviewStatus("error");
                  }}
                />
              </div>
            ) : null}

            {showLoadingOverlay ? (
              <LoadingState
                phase={loaderPhase}
                isProgressDeterminate={isProgressDeterminate}
                progressPercent={progressPercent}
                loadedLabel={loadedLabel}
                totalLabel={totalLabel}
              />
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}

type LoadingPhase = "awaiting" | "streaming" | "rendering";

type LoadingStateProps = {
  phase: LoadingPhase;
  isProgressDeterminate: boolean;
  progressPercent: number;
  loadedLabel: string;
  totalLabel: string | null;
};

const LOADING_COPY: Record<
  LoadingPhase,
  { heading: string; subline: string }
> = {
  awaiting: {
    heading: "Đang chờ máy chủ phản hồi…",
    subline:
      "Máy chủ chưa bắt đầu truyền dữ liệu. Với tài liệu lớn, bước này có thể mất vài chục giây nếu máy chủ chưa hỗ trợ tải từng phần.",
  },
  streaming: {
    heading: "Đang tải tài liệu…",
    subline:
      "Tài liệu được lưu tạm trong phiên — các lần mở lại sau sẽ hiển thị gần như tức thì.",
  },
  rendering: {
    heading: "Đang dựng trang xem trước…",
    subline: "Trang đầu tiên sẽ xuất hiện ngay khi trình xem hoàn tất.",
  },
};

function LoadingState({
  phase,
  isProgressDeterminate,
  progressPercent,
  loadedLabel,
  totalLabel,
}: LoadingStateProps) {
  const { heading, subline } = LOADING_COPY[phase];

  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-surface-container/85 backdrop-blur-[2px]">
      <div className="flex w-[min(20rem,calc(100%-2rem))] flex-col items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-high px-5 py-5 text-on-surface-variant shadow-lg sm:w-80">
        <span className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-primary/30 border-t-primary" />
        <div className="text-center">
          <p className="font-headline text-sm font-semibold text-on-surface sm:text-base">
            {heading}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
            {subline}
          </p>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isProgressDeterminate ? progressPercent : undefined}
            aria-label="Tiến độ tải tài liệu"
          >
            {isProgressDeterminate ? (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            ) : (
              <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-[citation-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary/80" />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] tabular-nums text-on-surface-variant">
            <span>
              {totalLabel ? `${loadedLabel} / ${totalLabel}` : loadedLabel}
            </span>
            <span>{isProgressDeterminate ? `${progressPercent}%` : "…"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  tone?: "default" | "error";
};

function EmptyState({ icon, title, description, tone = "default" }: EmptyStateProps) {
  const accent =
    tone === "error"
      ? "bg-error-container text-on-error-container"
      : "bg-surface-container-high text-on-surface-variant";
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${accent}`}
        >
          <span aria-hidden className="material-symbols-outlined text-xl">
            {icon}
          </span>
        </span>
        <p className="font-headline text-base font-semibold text-on-surface">
          {title}
        </p>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}

type UnsupportedPreviewProps = {
  filename: string | null;
  downloadUrl: string;
};

function UnsupportedPreview({ filename, downloadUrl }: UnsupportedPreviewProps) {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <span aria-hidden className="material-symbols-outlined text-xl">
            description
          </span>
        </span>
        <p className="font-headline text-base font-semibold text-on-surface">
          Không hỗ trợ xem trực tiếp
        </p>
        <p className="text-sm text-on-surface-variant">
          {filename
            ? `Tài liệu “${filename}” không thể xem trực tiếp trong trình duyệt.`
            : "Định dạng tài liệu này không thể xem trực tiếp trong trình duyệt."}
        </p>
        <a
          href={downloadUrl}
          download={filename ?? undefined}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <span aria-hidden className="material-symbols-outlined text-sm">
            download
          </span>
          Tải xuống
        </a>
      </div>
    </div>
  );
}
