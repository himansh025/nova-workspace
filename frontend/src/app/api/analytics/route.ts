import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    const analytics = db.getAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
