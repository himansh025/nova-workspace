import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    const team = db.getTeam();
    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }
    const initials = body.name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newMember = db.addTeamMember({
      name: body.name,
      email: body.email || `${body.name.toLowerCase().replace(/\s+/g, ".")}@nova.dev`,
      role: body.role,
      avatar: body.avatar || "",
      initials,
      status: "online"
    });

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}
