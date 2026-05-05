"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Citation,
  getCitationDocumentUrl,
  getCitationDownloadUrl,
} from "@/app/_lib/citations";

type CitationPanelProps = {
  citation: Citation | null;
  onClose: () => void;
};

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; objectUrl: string; mediaType: string }
  | { status: "error"; message: string };

const isPdf = (mediaType: string | null | undefined) =>
  typeof mediaType === "string" && mediaType.toLowerCase().includes("pdf");

const isImage = (mediaType: string | null | undefined) =>
  typeof mediaType === "string" && mediaType.toLowerCase().startsWith("image/");

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

export default function CitationPanel({ citation, onClose }: CitationPanelProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!citation || !citation.available) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview({ status: "idle" });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setPreview({ status: "loading" });

    void (async () => {
      try {
        const response = await fetch(getCitationDocumentUrl(citation), {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!cancelled) {
            setPreview({
              status: "error",
              message:
                response.status === 404
                  ? "Không tìm thấy tài liệu trên hệ thống."
                  : "Không thể tải tài liệu, vui lòng thử lại.",
            });
          }
          return;
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        objectUrlRef.current = objectUrl;
        setPreview({
          status: "ready",
          objectUrl,
          mediaType:
            citation.media_type ?? blob.type ?? "application/octet-stream",
        });
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") {
          return;
        }
        setPreview({
          status: "error",
          message: "Không thể tải tài liệu, vui lòng thử lại.",
        });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [citation]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  if (!citation) {
    return null;
  }

  const subtitle = buildSubtitle(citation);

  return (
    <aside
      role="complementary"
      aria-label="Xem tài liệu trích dẫn"
      className="flex h-full w-full flex-col bg-surface-container-low"
    >
      <header className="flex items-start gap-3 border-b border-outline-variant/30 bg-surface-container-low px-4 py-3">
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
            className="truncate font-headline text-base font-semibold text-on-surface"
            title={citation.title}
          >
            {citation.title || citation.id}
          </h2>
          {subtitle ? (
            <p
              className="mt-0.5 truncate text-xs text-on-surface-variant"
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

      <div className="flex items-center gap-2 border-b border-outline-variant/30 bg-surface-container-low px-4 py-2">
        <a
          href={getCitationDownloadUrl(citation)}
          download={citation.filename ?? undefined}
          aria-disabled={!citation.available}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
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
        {preview.status === "ready" ? (
          <a
            href={preview.objectUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary/60 hover:bg-surface-container hover:text-primary"
          >
            <span aria-hidden className="material-symbols-outlined text-sm">
              open_in_new
            </span>
            Mở tab mới
          </a>
        ) : null}
        <span className="ml-auto truncate text-[11px] text-on-surface-variant/70">
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
        ) : preview.status === "loading" ? (
          <LoadingState />
        ) : preview.status === "error" ? (
          <EmptyState
            icon="error"
            title="Không thể tải tài liệu"
            description={preview.message}
            tone="error"
          />
        ) : preview.status === "ready" ? (
          isPdf(preview.mediaType) ? (
            <iframe
              key={preview.objectUrl}
              src={preview.objectUrl}
              title={citation.title}
              className="h-full w-full border-0 bg-white"
            />
          ) : isImage(preview.mediaType) ? (
            <div className="h-full w-full overflow-auto bg-surface-container p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.objectUrl}
                alt={citation.title}
                className="mx-auto block max-w-full"
              />
            </div>
          ) : (
            <UnsupportedPreview
              filename={citation.filename}
              downloadUrl={getCitationDownloadUrl(citation)}
            />
          )
        ) : null}
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-container">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="inline-flex h-9 w-9 animate-spin items-center justify-center rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm">Đang tải tài liệu…</p>
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
