import { useEffect, useRef } from "react";
import type {
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
} from "react";

type MessageInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export default function MessageInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: MessageInputProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_TEXTAREA_HEIGHT = 192;

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
    <footer className="w-full px-3 sm:px-6 md:px-12 lg:px-24 xl:px-40 pb-4 sm:pb-8 bg-gradient-to-t from-surface via-surface to-transparent pt-5 sm:pt-8">
      <div className="max-w-5xl mx-auto relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="relative bg-surface-container-lowest diffusion-shadow rounded-2xl p-2 flex flex-col border border-outline-variant/10 focus-within:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-outline-variant/5 mb-1">
            <span className="text-[10px] font-bold text-primary-container bg-primary-fixed px-2 py-0.5 rounded uppercase">
              Luật Dân sự
            </span>
            <span className="text-[10px] font-bold text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded uppercase">
              Sở hữu trí tuệ
            </span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3 px-2 sm:px-3 py-2">
            <button
              type="button"
              className="p-2 text-on-surface-variant hover:text-primary transition-colors mb-1"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
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
              disabled={isLoading || input.trim().length === 0}
              className="legal-gradient w-10 h-10 rounded-full flex items-center justify-center text-on-primary diffusion-shadow active:scale-95 transition-transform mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-on-surface-variant/50 mt-4 tracking-wide font-medium">
          THE SOVEREIGN ASSOCIATE CÓ THỂ CUNG CẤP THÔNG TIN SAI LỆCH. VUI LÒNG
          KIỂM CHỨNG VỚI LUẬT SƯ CHUYÊN TRÁCH.
        </p>
      </div>
    </footer>
  );
}
