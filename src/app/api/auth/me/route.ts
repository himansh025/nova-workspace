import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/server/auth";

export async function GET(request: NextRequest) {
  // Check cookie or Authorization header
  const token =
    request.cookies.get("nova_session")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ authenticated: true, user: safeUser });
}
