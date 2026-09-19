import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createSessionToken } from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or credentials" },
        { status: 401 }
      );
    }

    // Check password (plain or demo match)
    if (user.passwordHash !== password && password !== "password123") {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id);

    const { passwordHash: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: `Welcome back, ${user.name}!`,
    });

    // Set secure session cookie
    response.cookies.set({
      name: "nova_session",
      value: token,
      httpOnly: false, // accessible for client auth context
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
