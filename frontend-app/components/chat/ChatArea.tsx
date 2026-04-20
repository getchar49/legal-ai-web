import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: string;
  role: string;
  content?: string;
  parts?: Array<{ type?: string; text?: string; state?: string }>;
};

type ChatAreaProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: Error;
};

const thinkTagPattern = /<think>([\s\S]*?)<\/think>/gi;

function splitThinkTag(rawText: string) {
  if (!rawText) {
    return { reasoning: "", answer: "" };
  }

  let reasoning = "";
  const answer = rawText
    .replace(thinkTagPattern, (_, captured: string) => {
      if (captured?.trim()) {
        reasoning = `${reasoning}\n${captured.trim()}`.trim();
      }
      return "";
    })
    .trim();

  return {
    reasoning,
    answer,
  };
}

function getRawMessageText(message: ChatMessage): string {
  if (typeof message.content === "string" && message.content.length > 0) {
    return message.content;
  }

  if (!Array.isArray(message.parts)) {
    return "";
  }

  return message.parts
    .map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .join("")
    .trim();
}

function getMessageText(message: ChatMessage): string {
  const rawText = getRawMessageText(message);
  if (message.role !== "assistant") {
    return rawText;
  }

  return splitThinkTag(rawText).answer;
}

function getMessageReasoning(message: ChatMessage): string {
  const parsedReasoningFromText =
    message.role === "assistant" ? splitThinkTag(getRawMessageText(message)).reasoning : "";

  if (!Array.isArray(message.parts)) {
    return parsedReasoningFromText;
  }

  const reasoningFromParts = message.parts
    .map((part) => (part.type === "reasoning" ? part.text ?? "" : ""))
    .join("")
    .trim();

  return reasoningFromParts || parsedReasoningFromText;
}

export default function ChatArea({ messages, isLoading, error }: ChatAreaProps) {
  return (
    <section className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 lg:px-24 xl:px-40 py-6 sm:py-8 space-y-4 sm:space-y-5 scroll-smooth">
      <div className="flex justify-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 bg-surface-container-low px-4 py-1 rounded-full">
          Hôm nay
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-on-surface-variant">
            Bắt đầu cuộc trò chuyện mới bằng cách đặt câu hỏi ở bên dưới.
          </p>
        </div>
      ) : (
        messages.map((message) => {
          const text = getMessageText(message);
          const reasoning = getMessageReasoning(message);
          const isUser = message.role === "user";

          if (!text && !reasoning) {
            return null;
          }

          if (isUser) {
            return (
              <div key={message.id} className="flex flex-col items-end space-y-2">
                <div className="bg-primary-container text-on-primary p-3 sm:p-4 rounded-xl rounded-br-sm max-w-[92%] sm:max-w-[85%] diffusion-shadow">
                  <p className="font-headline text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                    {text}
                  </p>
                </div>
                <span className="text-[10px] text-on-surface-variant px-2">
                  Đã gửi
                </span>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex flex-col items-start space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full legal-gradient flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-sm">gavel</span>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant/80 tracking-[0.14em] uppercase">
                  The Sovereign AI
                </span>
              </div>
              <div className="bg-surface-container-highest p-4 sm:p-6 rounded-xl max-w-[96%] sm:max-w-[90%] space-y-4">
                {reasoning ? (
                  <details className="rounded-lg border border-outline-variant/30 bg-surface px-4 py-3">
                    <summary className="cursor-pointer text-xs font-semibold tracking-wide text-on-surface-variant">
                      Xem suy luận
                    </summary>
                    <div className="mt-3 text-sm leading-relaxed text-on-surface-variant [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning}</ReactMarkdown>
                    </div>
                  </details>
                ) : null}
                <div className="font-body text-base leading-loose text-on-surface [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })
      )}

      {isLoading ? (
        <div className="flex flex-col items-start space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full legal-gradient flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-sm">gavel</span>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant/80 tracking-[0.14em] uppercase">
              The Sovereign AI
            </span>
          </div>
          <div className="bg-surface-container-highest p-6 rounded-xl max-w-[90%]">
            <p className="text-sm text-on-surface-variant">Đang soạn trả lời...</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          {error.message}
        </div>
      ) : null}
    </section>
  );
}
