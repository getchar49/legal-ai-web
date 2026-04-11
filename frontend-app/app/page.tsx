"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import ChatArea from "@/components/chat/ChatArea";
import Header from "@/components/chat/Header";
import MessageInput from "@/components/chat/MessageInput";
import Sidebar from "@/components/chat/Sidebar";
import {
  API_ROUTES,
  getHistoryDetailRoute,
  requestJson,
} from "@/app/_lib/api-client";

type ConversationMetadata = {
  conversation_id?: string;
};

type RawHistoryMessage = Record<string, unknown>;

const resolveConversationId = (data: unknown): string => {
  const entry = (data as Record<string, unknown>) ?? {};
  const id =
    entry.conversation_id ??
    entry.id ??
    entry._id ??
    (entry.conversation as Record<string, unknown> | undefined)?.id ??
    (entry.conversation as Record<string, unknown> | undefined)?._id;
  return typeof id === "string" ? id : "";
};

const extractString = (
  value: unknown,
  fallback = "",
): string => (typeof value === "string" ? value : fallback);

const splitThinkTag = (rawText: string) => {
  const match = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) {
    return {
      reasoning: "",
      answer: rawText,
    };
  }

  return {
    reasoning: match[1]?.trim() ?? "",
    answer: rawText.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim(),
  };
};

const stripThinkTags = (rawText: string) =>
  rawText.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();

const normalizeHistoryMessages = (data: unknown): UIMessage[] => {
  const raw = data as Record<string, unknown>;
  const rawMessages = Array.isArray(data)
    ? data
    : Array.isArray(raw?.messages)
      ? raw.messages
      : Array.isArray((raw?.conversation as Record<string, unknown>)?.messages)
        ? ((raw.conversation as Record<string, unknown>).messages as unknown[])
        : [];

  return rawMessages
    .map((item, index) => {
      const message = item as RawHistoryMessage;
      const rawRole = extractString(message.role).toLowerCase();
      const role: UIMessage["role"] =
        rawRole === "assistant" || rawRole === "ai" || rawRole === "bot"
          ? "assistant"
          : "user";

      const contentText = extractString(message.content);
      const fullContentText = extractString(message.full_content);
      const reasoningFromField = extractString(
        message.reasoning_content ?? message.reasoning,
      );
      const sourceText = contentText || fullContentText;
      const parsedThink = splitThinkTag(sourceText);
      const answer = stripThinkTags(contentText || parsedThink.answer);
      const reasoning = (reasoningFromField || parsedThink.reasoning).trim();

      const parts: UIMessage["parts"] = [];
      if (role === "assistant" && reasoning) {
        parts.push({ type: "reasoning", text: reasoning });
      }
      if (answer) {
        parts.push({ type: "text", text: answer });
      }

      return {
        id: extractString(message.id ?? message._id, `history-${index + 1}`),
        role,
        parts,
      } as UIMessage;
    })
    .filter((message) => Array.isArray(message.parts) && message.parts.length > 0);
};

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API_ROUTES.chat,
      }),
    [],
  );

  const handleLogout = useCallback(
    async (message?: string) => {
      try {
        await requestJson<{ ok: boolean }>(API_ROUTES.auth.logout, {
          method: "POST",
        });
      } catch {
        // No-op: redirecting to login is enough here.
      }

      setIsAuthenticated(false);
      setInput("");
      setSessionMessage(message ?? null);
      router.push("/login");
    },
    [router],
  );

  useEffect(() => {
    let isDisposed = false;

    const checkSession = async () => {
      try {
        const data = await requestJson<{ authenticated?: boolean }>(
          API_ROUTES.auth.session,
          {
          cache: "no-store",
          },
        );
        const authenticated = Boolean(data.authenticated);

        if (isDisposed) {
          return;
        }

        setIsAuthenticated(authenticated);
        if (!authenticated) {
          router.replace("/login");
        }
      } catch {
        if (!isDisposed) {
          setIsAuthenticated(false);
          router.replace("/login");
        }
      } finally {
        if (!isDisposed) {
          setIsCheckingAuth(false);
        }
      }
    };

    void checkSession();

    return () => {
      isDisposed = true;
    };
  }, [router]);

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      const metadata = (message.metadata ?? {}) as ConversationMetadata;
      if (typeof metadata.conversation_id === "string" && metadata.conversation_id) {
        setActiveConversationId(metadata.conversation_id);
      }
      setHistoryRefreshKey((prev) => prev + 1);
    },
    onError: chatError => {
      if (
        /invalid token|not authenticated|401|unauthorized/i.test(
          chatError.message,
        )
      ) {
        void handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    },
  });

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
  }, [setMessages]);

  const createConversation = useCallback(async () => {
    const data = await requestJson<unknown>(API_ROUTES.history, {
      method: "POST",
      cache: "no-store",
      fallbackErrorMessage: "Không thể tạo cuộc trò chuyện mới.",
    });
    const id = resolveConversationId(data);
    if (!id) {
      throw new Error("Không nhận được conversation_id từ backend.");
    }
    return id;
  }, []);

  const handleNewChat = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    setSessionMessage(null);
    handleClearMessages();
    try {
      const conversationId = await createConversation();
      setActiveConversationId(conversationId);
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tạo cuộc trò chuyện mới.";
      if (/invalid token|not authenticated|401|unauthorized/i.test(message)) {
        void handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        return;
      }
      setSessionMessage(message);
      setActiveConversationId("");
    }
  }, [createConversation, handleClearMessages, handleLogout, isAuthenticated]);

  const handleOpenConversation = useCallback(
    async (conversationId: string) => {
      if (!conversationId || !isAuthenticated) {
        return;
      }

      setIsLoadingConversation(true);
      setSessionMessage(null);
      try {
        const data = await requestJson<unknown>(getHistoryDetailRoute(conversationId), {
          method: "GET",
          cache: "no-store",
          fallbackErrorMessage: "Không thể mở cuộc trò chuyện.",
        });

        const normalizedMessages = normalizeHistoryMessages(data);
        setMessages(normalizedMessages);
        setInput("");
        setActiveConversationId(conversationId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện.";
        if (/invalid token|not authenticated|401|unauthorized/i.test(message)) {
          void handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }
        setSessionMessage(message);
      } finally {
        setIsLoadingConversation(false);
      }
    },
    [handleLogout, isAuthenticated, setMessages],
  );

  const handleConversationDeleted = useCallback(
    (conversationId: string) => {
      setHistoryRefreshKey((prev) => prev + 1);
      if (conversationId === activeConversationId) {
        setActiveConversationId("");
        handleClearMessages();
      }
    },
    [activeConversationId, handleClearMessages],
  );

  const handleNewChatClick = useCallback(() => {
    void handleNewChat();
  }, [handleNewChat]);

  const handleLogoutClick = useCallback(() => {
    void handleLogout();
  }, [handleLogout]);

  const handleAuthExpired = useCallback(() => {
    void handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }, [handleLogout]);

  const handleOpenConversationClick = useCallback(
    (conversationId: string) => {
      void handleOpenConversation(conversationId);
    },
    [handleOpenConversation],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || !isAuthenticated) {
      return;
    }
    setInput("");

    void (async () => {
      try {
        let conversationId = activeConversationId;
        if (!conversationId) {
          conversationId = await createConversation();
          setActiveConversationId(conversationId);
          setHistoryRefreshKey((prev) => prev + 1);
        }

        await sendMessage(
          { text: value },
          {
            body: {
              conversation_id: conversationId,
            },
          },
        );
      } catch (error) {
        setInput(value);
        const message =
          error instanceof Error ? error.message : "Không thể gửi tin nhắn.";
        if (/invalid token|not authenticated|401|unauthorized/i.test(message)) {
          void handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }
        setSessionMessage(message);
      }
    })();
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  return (
    <div className="bg-background font-body text-on-surface flex h-screen overflow-hidden">
      <Sidebar
        hasToken={isAuthenticated}
        onNewChat={handleNewChatClick}
        onLogout={handleLogoutClick}
        onAuthExpired={handleAuthExpired}
        onOpenConversation={handleOpenConversationClick}
        onConversationDeleted={handleConversationDeleted}
        activeConversationId={activeConversationId}
        refreshKey={historyRefreshKey}
      />
      <main className="flex-1 flex flex-col relative bg-surface overflow-hidden">
        <Header
          hasToken={isAuthenticated}
          onLogout={handleLogoutClick}
        />
        {sessionMessage ? (
          <div className="mx-4 mt-3 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            {sessionMessage}
          </div>
        ) : null}
        <ChatArea
          messages={messages}
          isLoading={
            isLoadingConversation ||
            status === "submitted" ||
            status === "streaming"
          }
          error={error ?? undefined}
        />
        <MessageInput
          input={input}
          isLoading={
            isCheckingAuth ||
            isLoadingConversation ||
            status === "submitted" ||
            status === "streaming"
          }
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
