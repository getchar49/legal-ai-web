import { NextResponse } from "next/server";
import {
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
      { message: "Dữ liệu đăng ký không hợp lệ." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(
    buildBackendUrl(BACKEND_ENDPOINTS.register),
    {
      method: "POST",
      headers: createBackendHeaders({ contentType: "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const data: unknown = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
