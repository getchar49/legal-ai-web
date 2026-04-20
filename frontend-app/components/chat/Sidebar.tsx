"use client";

import { useEffect, useState } from "react";
import {
  API_ROUTES,
  ApiClientError,
  getHistoryDetailRoute,
  requestJson,
} from "@/app/_lib/api-client";
import {
  CHAT_UI_VISIBILITY,
  GENERIC_HISTORY_TITLE_PATTERNS,
} from "@/components/chat/chatUiConfig";

type HistoryItem = {
  id: string;
  title: string;
};

type RecentDocumentItem = {
  id: string;
  title: string;
  icon: string;
};

const DEFAULT_HISTORY_TITLE = "Cuộc trò chuyện chưa có tiêu đề";

const normalizeText = (value: unknown): string =>
  (typeof value === "string" ? value : "").replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const isGenericHistoryTitle = (title: string): boolean => {
  if (!title) {
    return true;
  }
  const normalized = title.toLocaleLowerCase("vi-VN").trim();
  return GENERIC_HISTORY_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const getFirstQuestionFromMessages = (messages: unknown): string => {
  if (!Array.isArray(messages)) {
    return "";
  }

  for (const item of messages) {
    const message = item as Record<string, unknown>;
    const role = normalizeText(message.role).toLowerCase();
    if (role && role !== "user") {
      continue;
    }
    const candidate = normalizeText(message.content ?? message.text);
    if (candidate) {
      return candidate;
    }
  }

  return "";
};

const resolveHistoryTitle = (entry: Record<string, unknown>): string => {
  const candidates = [
    entry.summary,
    entry.title,
    entry.first_message,
    entry.first_user_message,
    entry.first_question,
    entry.question,
    entry.prompt,
    entry.name,
    getFirstQuestionFromMessages(entry.messages),
  ];

  const title =
    candidates
      .map((candidate) => normalizeText(candidate))
      .find((candidate) => candidate.length > 0 && !isGenericHistoryTitle(candidate)) ??
    "";
  const finalTitle = title || DEFAULT_HISTORY_TITLE;
  return truncateText(finalTitle, CHAT_UI_VISIBILITY.history.titleMaxLength);
};

type SidebarProps = {
  hasToken: boolean;
  onNewChat: () => void;
  onLogout: () => void;
  onAuthExpired: () => void;
  onCloseSidebar?: () => void;
  onOpenConversation: (conversationId: string) => void;
  onConversationDeleted: (conversationId: string) => void;
  activeConversationId?: string;
  refreshKey?: number;
};

export default function Sidebar({
  hasToken,
  onNewChat,
  onLogout,
  onAuthExpired,
  onCloseSidebar,
  onOpenConversation,
  onConversationDeleted,
  activeConversationId,
  refreshKey = 0,
}: SidebarProps) {
  const recentDocuments: RecentDocumentItem[] =
    CHAT_UI_VISIBILITY.sidebar.showLaborContractTemplate
      ? [
          {
            id: "sample-labor-contract",
            title: "Hợp đồng lao động mẫu",
            icon: "description",
          },
        ]
      : [];

  const shouldShowRecentDocumentsSection =
    recentDocuments.length > 0 ||
    CHAT_UI_VISIBILITY.sidebar.showRecentDocumentsWhenEmpty;

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToken) {
      setHistoryItems([]);
      setHistoryError(null);
      return;
    }

    const fetchHistory = async () => {
      try {
        setHistoryError(null);
        const data = await requestJson<unknown>(API_ROUTES.history, {
          method: "GET",
          cache: "no-store",
          fallbackErrorMessage: "Không thể tải lịch sử trò chuyện.",
        });
        const rawItems = Array.isArray(data)
          ? data
          : Array.isArray((data as { history?: unknown[] })?.history)
            ? (data as { history: unknown[] }).history
            : [];

        const normalizedItems = rawItems.map((item, index) => {
          const entry = item as Record<string, unknown>;
          const id = String(
            entry.id ?? entry._id ?? entry.conversation_id ?? index,
          );
          const title = resolveHistoryTitle(entry);
          return { id, title };
        });

        setHistoryItems(normalizedItems);
      } catch (error) {
        if (
          error instanceof ApiClientError &&
          (error.status === 401 || /invalid token/i.test(error.message))
        ) {
          onAuthExpired();
          return;
        }
        const message =
          error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        setHistoryError(message);
      }
    };

    void fetchHistory();
  }, [hasToken, onAuthExpired, refreshKey]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (isDeletingId) {
      return;
    }

    setIsDeletingId(conversationId);
    setHistoryError(null);

    try {
      await requestJson<unknown>(getHistoryDetailRoute(conversationId), {
        method: "DELETE",
        fallbackErrorMessage: "Không thể xóa cuộc trò chuyện.",
      });

      setHistoryItems((prev) => prev.filter((item) => item.id !== conversationId));
      onConversationDeleted(conversationId);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        (error.status === 401 || /invalid token/i.test(error.message))
      ) {
        onAuthExpired();
        return;
      }
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Đã có lỗi xảy ra khi xóa.",
      );
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-outline-variant/20 bg-surface-container-low px-4 py-6">
      <div className="mb-8 flex items-start justify-between gap-2">
        <div>
          <h1 className="font-headline text-xl font-bold tracking-tighter text-primary">
            The Sovereign Associate
          </h1>
          <p className="mt-1 text-xs tracking-wide text-on-surface-variant opacity-80">
            Elite Legal Intelligence
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseSidebar}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
          aria-label="Đóng sidebar"
        >
          <span aria-hidden className="material-symbols-outlined">
            close
          </span>
        </button>
      </div>

      <button
        onClick={onNewChat}
        className="legal-gradient text-on-primary w-full py-3 px-4 rounded-full flex items-center justify-center gap-3 mb-8 transition-transform active:scale-95 duration-150"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        <span className="font-headline font-semibold text-sm">
          Cuộc trò chuyện mới
        </span>
      </button>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {hasToken ? (
          <>
            <h2 className="px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-3">
              Lịch sử trò chuyện
            </h2>
            {historyError ? (
              <p className="px-4 text-xs text-error">{historyError}</p>
            ) : historyItems.length === 0 ? (
              <p className="px-4 text-xs text-on-surface-variant/80">
                Chưa có lịch sử trò chuyện.
              </p>
            ) : (
              historyItems.map((item, index) => (
                <div
                  key={item.id}
                  className={
                    item.id === activeConversationId
                      ? "group/history flex items-center gap-2 rounded-r-lg border-l-4 border-primary bg-surface-container-lowest px-2 py-2 text-primary transition-colors duration-200"
                      : "group/history flex items-center gap-2 rounded-lg px-2 py-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface"
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      onOpenConversation(item.id);
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 px-2 py-1"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {item.id === activeConversationId || index === 0
                        ? "gavel"
                        : "history"}
                    </span>
                    <span className="font-headline font-medium text-sm tracking-wide truncate flex-1 text-left">
                      {item.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteConversation(item.id);
                    }}
                    className={`material-symbols-outlined text-lg px-2 py-1 transition-opacity ${
                      isDeletingId === item.id
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none group-hover/history:opacity-60 group-hover/history:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto hover:opacity-100"
                    }`}
                    aria-label="Xóa cuộc trò chuyện"
                  >
                    {isDeletingId === item.id ? "hourglass_empty" : "delete"}
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          <p className="px-4 text-sm text-on-surface-variant/80">
            Đăng nhập để lưu lịch sử
          </p>
        )}

        {shouldShowRecentDocumentsSection ? (
          <div className="mt-6">
            <h2 className="px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-3">
              Tài liệu gần đây
            </h2>
            {recentDocuments.map((document) => (
              <div
                key={document.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">
                  {document.icon}
                </span>
                <span className="font-headline font-medium text-sm tracking-wide truncate">
                  {document.title}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline-variant/20 pt-4">
        {CHAT_UI_VISIBILITY.sidebar.showSettings ? (
          <div className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface">
            <span aria-hidden className="material-symbols-outlined text-xl">
              settings
            </span>
            <span className="font-headline text-sm font-medium tracking-wide">
              Cài đặt
            </span>
          </div>
        ) : null}
        {CHAT_UI_VISIBILITY.sidebar.showSupport ? (
          <div className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface">
            <span aria-hidden className="material-symbols-outlined text-xl">
              help_outline
            </span>
            <span className="font-headline text-sm font-medium tracking-wide">
              Hỗ trợ
            </span>
          </div>
        ) : null}
        {hasToken ? (
          <button
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span aria-hidden className="material-symbols-outlined text-xl">
              logout
            </span>
            <span className="font-headline text-sm font-medium tracking-wide">
              Đăng xuất
            </span>
          </button>
        ) : null}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="legal-gradient h-10 w-10 rounded-full" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-on-surface">
              Luật sư cao cấp
            </span>
            <span className="text-[10px] text-on-surface-variant">
              Thành viên Premium
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
