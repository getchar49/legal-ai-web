import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "../../_lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
}
