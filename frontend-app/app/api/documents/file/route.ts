import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_ENDPOINTS,
  buildBackendUrl,
  createBackendHeaders,
  readErrorMessage,
} from "../../_lib/backend";

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "accept-ranges",
  "cache-control",
  "etag",
  "last-modified",
  "x-citation-id",
  "x-document-category",
];

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const citationId = url.searchParams.get("citation_id");
  if (!citationId) {
    return NextResponse.json(
      { message: "Thiếu citation_id." },
      { status: 400 },
    );
  }

  const inline = url.searchParams.get("inline") ?? "true";
  const backendUrl = new URL(buildBackendUrl(BACKEND_ENDPOINTS.documentsFile));
  backendUrl.searchParams.set("citation_id", citationId);
  backendUrl.searchParams.set("inline", inline);

  const range = request.headers.get("range");
  const headers = createBackendHeaders({ token, accept: "*/*" });
  if (range) {
    headers["Range"] = range;
  }

  const backendResponse = await fetch(backendUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!backendResponse.ok && backendResponse.status !== 206) {
    const message = await readErrorMessage(backendResponse);
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  const responseHeaders = new Headers();
  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(headerName);
    if (value) {
      responseHeaders.set(headerName, value);
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
