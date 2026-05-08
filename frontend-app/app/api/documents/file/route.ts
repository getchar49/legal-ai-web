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
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
  "x-citation-id",
  "x-document-category",
];

const isInlinePreview = (request: NextRequest): boolean => {
  const inline = request.nextUrl.searchParams.get("inline");
  if (inline === null) {
    return true;
  }
  return inline !== "false" && inline !== "0";
};

const buildBackendDocumentUrl = (request: NextRequest): URL | null => {
  const citationId = request.nextUrl.searchParams.get("citation_id");
  if (!citationId) {
    return null;
  }

  const backendUrl = new URL(buildBackendUrl(BACKEND_ENDPOINTS.documentsFile));
  backendUrl.searchParams.set("citation_id", citationId);
  backendUrl.searchParams.set(
    "inline",
    request.nextUrl.searchParams.get("inline") ?? "true",
  );
  return backendUrl;
};

const buildResponseHeaders = (
  backendResponse: Response,
  inline: boolean,
): Headers => {
  const headers = new Headers();
  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  // Range support is what lets the embedded PDF viewer skip the costly
  // "download the entire file twice" fallback. We prefer whatever the
  // backend advertised, but explicitly add the header when missing so
  // browsers (and the bundled Chrome PDF viewer) can issue Range
  // requests.
  if (!headers.has("accept-ranges")) {
    headers.set("accept-ranges", "bytes");
  }

  // Document bytes are user-scoped (auth via session cookie), so allow
  // the browser cache but never any shared/proxy cache. A short max-age
  // is enough to satisfy the typical "open then re-open the same
  // citation" pattern without serving stale content for long.
  if (inline) {
    headers.set(
      "cache-control",
      "private, max-age=300, stale-while-revalidate=60",
    );
  } else {
    headers.set("cache-control", "private, no-store");
  }

  return headers;
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const backendUrl = buildBackendDocumentUrl(request);
  if (!backendUrl) {
    return NextResponse.json(
      { message: "Thiếu citation_id." },
      { status: 400 },
    );
  }

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

  const responseHeaders = buildResponseHeaders(
    backendResponse,
    isInlinePreview(request),
  );

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function HEAD(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  const backendUrl = buildBackendDocumentUrl(request);
  if (!backendUrl) {
    return new NextResponse(null, { status: 400 });
  }

  const headers = createBackendHeaders({ token, accept: "*/*" });
  // Prefer the backend's HEAD; fall back to a streamed GET that we
  // discard. The `body: null` 200 response is what matters for the
  // PDF viewer probe.
  let backendResponse = await fetch(backendUrl, {
    method: "HEAD",
    headers,
    cache: "no-store",
  });

  if (!backendResponse.ok && backendResponse.status === 405) {
    backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    // Drain the body so the connection can be reused; we don't actually
    // forward the bytes for a HEAD request.
    backendResponse.body?.cancel().catch(() => undefined);
  }

  if (!backendResponse.ok) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  return new NextResponse(null, {
    status: 200,
    headers: buildResponseHeaders(backendResponse, isInlinePreview(request)),
  });
}
