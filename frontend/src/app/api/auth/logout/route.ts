import { NextRequest, NextResponse } from "next/server";
import { removeSessionToken } from "@/server/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("nova_session")?.value;
  if (token) {
    removeSessionToken(token);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  // Clear cookie
  response.cookies.set({
    name: "nova_session",
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}
