import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST() {
  try {
    db.resetDatabase();
    return NextResponse.json({ success: true, message: "Workspace reset to initial demo state." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset database" }, { status: 500 });
  }
}
