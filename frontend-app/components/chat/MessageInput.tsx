import { useEffect, useRef } from "react";
import type {
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
} from "react";
import { CHAT_UI_VISIBILITY } from "@/components/chat/chatUiConfig";

type AgentOption = {
  agent_id: string;
  name: string;
  description: string;
};

type MessageInputProps = {
  input: string;
  isLoading: boolean;
  selectedAgentId: string;
  onAgentChange: ChangeEventHandler<HTMLSelectElement>;
  agents: AgentOption[];
  isLoadingAgents: boolean;
  agentLoadError?: string | null;
  onInputChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export default function MessageInput({
  input,
  isLoading,
  selectedAgentId,
  onAgentChange,
  agents,
  isLoadingAgents,
  agentLoadError,
  onInputChange,
  onSubmit,
}: MessageInputProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_TEXTAREA_HEIGHT = 192;
  const hasInput = input.trim().length > 0;
  const canSubmit = !isLoading && hasInput;

  const resizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [input]);

  const handleTextareaChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    onInputChange(event);
    resizeTextarea(event.currentTarget);
  };

  const handleTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
    event,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && input.trim().length > 0) {
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <footer className="w-full px-3 sm:px-6 md:px-12 lg:px-24 xl:px-40 pb-4 sm:pb-8 bg-gradient-to-t from-surface via-surface to-transparent pt-5 sm:pt-8 border-t border-outline-variant/10 shadow-[0_-10px_24px_-20px_rgba(15,23,42,0.35)]">
      <div className="max-w-5xl mx-auto relative group">
        {/* Focus glow — only animates opacity, never theme colors. */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="relative bg-surface-container-lowest diffusion-shadow rounded-2xl p-2 flex flex-col border border-outline-variant/10 focus-within:border-primary/30 transition-[border-color] duration-150"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">
                auto_awesome
              </span>
              <span className="text-xs font-semibold tracking-wide text-on-surface-variant">
                Model
              </span>
            </div>
            <select
              value={selectedAgentId}
              onChange={onAgentChange}
              disabled={isLoadingAgents || agents.length === 0}
              className="min-w-48 max-w-full rounded-xl border border-outline-variant/20 bg-surface px-3 py-1.5 text-xs sm:text-sm text-on-surface shadow-sm focus:border-primary/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingAgents ? (
                <option value="">Đang tải model...</option>
              ) : null}
              {!isLoadingAgents && agents.length === 0 ? (
                <option value="">Không có model</option>
              ) : null}
              {agents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          {agentLoadError ? (
            <p className="px-4 pt-2 text-xs text-amber-700 dark:text-amber-300">
              {agentLoadError}
            </p>
          ) : null}
          {CHAT_UI_VISIBILITY.messageInput.showTopicTemplates ? (
            <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-outline-variant/5 mb-1">
              <span className="text-[10px] font-bold text-primary-container bg-primary-fixed px-2 py-0.5 rounded uppercase">
                Luật Dân sự
              </span>
              <span className="text-[10px] font-bold text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded uppercase">
                Sở hữu trí tuệ
              </span>
            </div>
          ) : null}
          <div className="flex items-end gap-2 sm:gap-3 px-2 sm:px-3 py-2">
            {CHAT_UI_VISIBILITY.messageInput.showAttachFile ? (
              <button
                type="button"
                className="p-2 text-on-surface-variant hover:text-primary transition-colors mb-1"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
            ) : null}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base px-2 sm:px-3 py-3 font-body resize-none leading-relaxed rounded-xl placeholder:text-on-surface-variant/70"
              placeholder="Đặt câu hỏi về pháp luật..."
              rows={1}
              style={{ minHeight: "48px" }}
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 active:scale-95 transition-[transform,opacity] duration-200 ${
                canSubmit
                  ? "legal-gradient text-on-primary diffusion-shadow"
                  : "bg-surface-container-high text-on-surface-variant/60 shadow-none cursor-not-allowed opacity-90"
              }`}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-on-surface-variant/70 mt-4 tracking-wide font-medium">
          THE SOVEREIGN ASSOCIATE CÓ THỂ CUNG CẤP THÔNG TIN SAI LỆCH. VUI LÒNG
          KIỂM CHỨNG VỚI LUẬT SƯ CHUYÊN TRÁCH.
        </p>
      </div>
    </footer>
  );
}
