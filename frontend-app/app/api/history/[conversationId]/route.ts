import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  createBackendHeaders,
  readErrorMessage,
} from "../../_lib/backend";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

const buildHistoryDetailPath = (conversationId: string) =>
  buildBackendUrl(BACKEND_ENDPOINTS.historyDetail(conversationId));

export async function GET(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { conversationId } = await context.params;
  const backendResponse = await fetch(buildHistoryDetailPath(conversationId), {
    method: "GET",
    headers: createBackendHeaders({ token }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const data: unknown = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { conversationId } = await context.params;
  const backendResponse = await fetch(buildHistoryDetailPath(conversationId), {
    method: "DELETE",
    headers: createBackendHeaders({ token }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const data: unknown = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data);
}
