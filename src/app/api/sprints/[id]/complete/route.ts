import { NextResponse } from "next/server";
import { completeSprint } from "@/server/sprintData";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { rolloverTargetId } = body;

    const result = completeSprint(id, rolloverTargetId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error completing sprint:", error);
    return NextResponse.json({ error: error.message || "Failed to complete sprint" }, { status: 500 });
  }
}
