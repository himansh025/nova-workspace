import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/server/auth";
import { broadcastEvent } from "@/server/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, organization } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const { user, token } = registerUser({
      name,
      email,
      password,
      role: role || "Software Engineer",
      organization: organization || "Nova Engineering Labs",
    });

    broadcastEvent({
      type: "system",
      category: "system",
      title: "New Team Member Onboarded",
      message: `${user.name} (${user.role}) registered and joined ${user.organization}`,
      link: "/app/team",
      meta: { userId: user.id },
    });

    const { passwordHash: _, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: `Account created successfully. Welcome, ${user.name}!`,
    }, { status: 201 });

    response.cookies.set({
      name: "nova_session",
      value: token,
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Signup failed" }, { status: 400 });
  }
}
