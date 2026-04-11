import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  createBackendHeaders,
  readErrorMessage,
} from "../_lib/backend";

type IncomingPart = { type?: string; text?: string };
type IncomingMessage = {
  role?: string;
  content?: string;
  parts?: IncomingPart[];
};
type IncomingPayload = {
  message?: string;
  conversation_id?: string;
  messages?: IncomingMessage[];
};

type BackendStreamEvent =
  | { type: "reasoning"; content?: string }
  | { type: "delta"; content?: string }
  | { type: "done"; conversation_id?: string }
  | { type: "error"; message?: string };

type BackendJsonResponse = {
  content?: string;
  full_content?: string;
  conversation_id?: string;
};

const textEncoder = new TextEncoder();

const toSseChunk = (data: unknown) =>
  textEncoder.encode(`data: ${JSON.stringify(data)}\n\n`);

const createUiMessageStreamHeaders = () => {
  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");
  return headers;
};

const createUiMessageChunkStreamFromText = (answer: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(toSseChunk({ type: "start" }));
      controller.enqueue(toSseChunk({ type: "start-step" }));
      controller.enqueue(toSseChunk({ type: "text-start", id: "text-1" }));
      if (answer.length > 0) {
        controller.enqueue(
          toSseChunk({ type: "text-delta", id: "text-1", delta: answer }),
        );
      }
      controller.enqueue(toSseChunk({ type: "text-end", id: "text-1" }));
      controller.enqueue(toSseChunk({ type: "finish-step" }));
      controller.enqueue(toSseChunk({ type: "finish", finishReason: "stop" }));
      controller.close();
    },
  });

const createUiMessageChunkStreamFromBackendSse = (
  stream: ReadableStream<Uint8Array>,
) => {
  const decoder = new TextDecoder("utf-8");

  return new ReadableStream<Uint8Array>({
    async cancel() {
      await stream.cancel();
    },
    start(controller) {
      controller.enqueue(toSseChunk({ type: "start" }));
      controller.enqueue(toSseChunk({ type: "start-step" }));
      controller.enqueue(toSseChunk({ type: "text-start", id: "text-1" }));

      const reader = stream.getReader();
      let buffer = "";
      let reasoningStarted = false;
      let textEnded = false;
      let finished = false;

      const closeOpenChunks = () => {
        if (reasoningStarted) {
          controller.enqueue(toSseChunk({ type: "reasoning-end", id: "reason-1" }));
          reasoningStarted = false;
        }
        if (!textEnded) {
          controller.enqueue(toSseChunk({ type: "text-end", id: "text-1" }));
          textEnded = true;
        }
        if (!finished) {
          controller.enqueue(toSseChunk({ type: "finish-step" }));
          controller.enqueue(toSseChunk({ type: "finish", finishReason: "stop" }));
          finished = true;
        }
      };

      const processEventBlock = (eventBlock: string) => {
        const dataLines = eventBlock
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart());

        if (dataLines.length === 0) {
          return;
        }

        const raw = dataLines.join("\n").trim();
        if (!raw) {
          return;
        }

        let event: BackendStreamEvent;
        try {
          event = JSON.parse(raw) as BackendStreamEvent;
        } catch {
          return;
        }

        if (event.type === "reasoning") {
          const chunk = event.content ?? "";
          if (!chunk) {
            return;
          }
          if (!reasoningStarted) {
            controller.enqueue(toSseChunk({ type: "reasoning-start", id: "reason-1" }));
            reasoningStarted = true;
          }
          controller.enqueue(
            toSseChunk({ type: "reasoning-delta", id: "reason-1", delta: chunk }),
          );
          return;
        }

        if (event.type === "delta") {
          const chunk = event.content ?? "";
          if (!chunk) {
            return;
          }
          controller.enqueue(
            toSseChunk({ type: "text-delta", id: "text-1", delta: chunk }),
          );
          return;
        }

        if (event.type === "error") {
          closeOpenChunks();
          controller.enqueue(
            toSseChunk({
              type: "error",
              errorText: event.message ?? "Stream error",
            }),
          );
          return;
        }

        if (event.type === "done") {
          if (event.conversation_id) {
            controller.enqueue(
              toSseChunk({
                type: "message-metadata",
                messageMetadata: { conversation_id: event.conversation_id },
              }),
            );
          }
          closeOpenChunks();
        }
      };

      void (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const normalized = buffer.replace(/\r\n/g, "\n");
            const events = normalized.split("\n\n");
            buffer = events.pop() ?? "";
            for (const eventBlock of events) {
              processEventBlock(eventBlock);
            }
          }

          if (buffer.trim().length > 0) {
            processEventBlock(buffer);
          }

          closeOpenChunks();
          controller.close();
        } catch (error) {
          closeOpenChunks();
          controller.enqueue(
            toSseChunk({
              type: "error",
              errorText: error instanceof Error ? error.message : "Stream error",
            }),
          );
          controller.close();
        } finally {
          reader.releaseLock();
        }
      })();
    },
  });
};

const getTextFromMessage = (message: IncomingMessage) => {
  if (typeof message.content === "string" && message.content.trim().length > 0) {
    return message.content.trim();
  }

  if (!Array.isArray(message.parts)) {
    return "";
  }

  return message.parts
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("")
    .trim();
};

const extractUserMessage = (payload: IncomingPayload) => {
  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  if (!Array.isArray(payload.messages)) {
    return "";
  }

  for (let i = payload.messages.length - 1; i >= 0; i -= 1) {
    const message = payload.messages[i];
    if (message.role !== "user") {
      continue;
    }
    const text = getTextFromMessage(message);
    if (text) {
      return text;
    }
  }

  return "";
};

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const payload: IncomingPayload = await request.json().catch(() => ({}));
  const userMessage = extractUserMessage(payload);
  const conversationId =
    typeof payload.conversation_id === "string" ? payload.conversation_id : "";

  if (!userMessage) {
    return NextResponse.json(
      { message: "Không có nội dung tin nhắn." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(buildBackendUrl(BACKEND_ENDPOINTS.chat), {
    method: "POST",
    headers: createBackendHeaders({
      token,
      contentType: "application/json",
      accept: "text/event-stream",
    }),
    body: JSON.stringify({
      message: userMessage,
      conversation_id: conversationId,
      stream: true,
    }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  if (!backendResponse.body) {
    return new NextResponse(
      createUiMessageChunkStreamFromText(""),
      {
        status: 200,
        headers: createUiMessageStreamHeaders(),
      },
    );
  }

  const contentType = backendResponse.headers.get("Content-Type") ?? "";

  if (contentType.toLowerCase().includes("application/json")) {
    const payload: BackendJsonResponse = await backendResponse
      .json()
      .catch(() => ({}));
    const answer =
      typeof payload.content === "string"
        ? payload.content
        : typeof payload.full_content === "string"
          ? payload.full_content
          : "";

    return new NextResponse(createUiMessageChunkStreamFromText(answer), {
      status: 200,
      headers: createUiMessageStreamHeaders(),
    });
  }

  return new NextResponse(
    createUiMessageChunkStreamFromBackendSse(backendResponse.body),
    {
      status: 200,
      headers: createUiMessageStreamHeaders(),
    },
  );
}
