import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  createBackendHeaders,
  readErrorMessage,
} from "../../_lib/backend";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu đăng nhập không hợp lệ." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(buildBackendUrl(BACKEND_ENDPOINTS.login), {
    method: "POST",
    headers: createBackendHeaders({ contentType: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const data: unknown = await backendResponse.json().catch(() => null);
  const accessToken = (data as { access_token?: string })?.access_token;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Không nhận được token từ hệ thống xác thực." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
