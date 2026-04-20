import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  createBackendHeaders,
  readErrorMessage,
} from "../../_lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const backendResponse = await fetch(buildBackendUrl(BACKEND_ENDPOINTS.chatAgents), {
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
