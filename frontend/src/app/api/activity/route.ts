import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "25", 10);
    const activities = db.getActivities(limit);
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
