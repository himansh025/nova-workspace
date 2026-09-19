import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { broadcastEvent } from "@/server/events";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId") || undefined;
    const releases = db.getReleases(projectId);
    return NextResponse.json({ releases, activeRelease: releases[0] || null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch releases" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { releaseId, action, canaryPercentage, status } = body;

    const id = releaseId || "rel-1";

    if (action === "run_checks") {
      const updated = db.runPreflightChecks(id);
      if (!updated) {
        return NextResponse.json({ error: "Release not found" }, { status: 404 });
      }

      broadcastEvent({
        type: "release_updated",
        category: "releases",
        title: "Preflight Checks Passed",
        message: `All automated pre-flight checks passed for ${updated.version}`,
        link: "/app/releases",
        meta: { releaseId: updated.id, version: updated.version },
      });

      return NextResponse.json({ release: updated });
    }

    const updates: Record<string, any> = {};
    if (canaryPercentage !== undefined) updates.canaryPercentage = canaryPercentage;
    if (status) updates.status = status;

    const updated = db.updateRelease(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }

    broadcastEvent({
      type: "release_updated",
      category: "releases",
      title: updated.status === "released" ? "GA Release Promoted 🚀" : "Canary Rollout Shifted",
      message: updated.status === "released" 
        ? `${updated.version} promoted to 100% General Availability in production`
        : `Traffic adjusted to ${updated.canaryPercentage}% canary on ${updated.version}`,
      link: "/app/releases",
      meta: { releaseId: updated.id, version: updated.version, percentage: updated.canaryPercentage },
    });

    return NextResponse.json({ release: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update release" }, { status: 500 });
  }
}
