import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { broadcastEvent } from "@/server/events";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const spec = db.getSpecById(id);
  if (!spec) {
    return NextResponse.json({ error: "Spec not found" }, { status: 404 });
  }
  return NextResponse.json({ spec });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = db.updateSpec(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }

    broadcastEvent({
      type: updated.status === "approved" ? "spec_approved" : "spec_updated",
      category: "specs",
      title: updated.status === "approved" ? "Architecture Spec Approved" : "Spec Updated",
      message: `${updated.author.name} ${updated.status === "approved" ? "approved" : "updated"} ${updated.key}: ${updated.title}`,
      link: "/app/specs",
      meta: { specId: updated.id, key: updated.key, status: updated.status },
    });

    return NextResponse.json({ spec: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update spec" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const success = db.deleteSpec(id);
    if (!success) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete spec" }, { status: 500 });
  }
}
