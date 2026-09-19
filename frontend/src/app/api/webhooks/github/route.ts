import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { broadcastEvent } from "@/server/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, branch = "main", commitSha = "7b23f1e", prTitle } = body;

    if (event === "push") {
      const projects = db.getProjects();
      if (projects[0]) {
        db.updateProject(projects[0].id, {
          activeBranch: `main@${commitSha.slice(0, 7)}`
        });
      }

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: "Git Push Event",
        message: `Commit ${commitSha.slice(0, 7)} pushed to branch ${branch}`,
        link: "/app/tasks",
        meta: { branch, commitSha },
      });

      return NextResponse.json({
        success: true,
        event: "push",
        message: `Pushed commit ${commitSha.slice(0, 7)} to branch ${branch}. Workspace state updated.`
      });
    }

    if (event === "pull_request_merged") {
      const reviewTasks = db.getTasks({ status: "review" });
      let targetTaskKey = "NV-847";

      if (reviewTasks.length > 0) {
        db.updateTask(reviewTasks[0].id, { status: "done" });
        targetTaskKey = reviewTasks[0].key;
      }

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: "Pull Request Merged",
        message: `Merged "${prTitle || "Optimistic offline mutations"}". ${targetTaskKey} moved to DONE`,
        link: "/app/tasks",
        meta: { prTitle, targetTaskKey },
      });

      return NextResponse.json({
        success: true,
        event: "pull_request_merged",
        message: `Merged PR "${prTitle || "Optimistic offline mutations"}". Transitioned ${targetTaskKey} to DONE.`
      });
    }

    if (event === "ci_passed") {
      const releases = db.getReleases();
      if (releases[0]) {
        db.runPreflightChecks(releases[0].id);
      }

      broadcastEvent({
        type: "release_updated",
        category: "releases",
        title: "CI Suite Passed 🛡️",
        message: "Automated CI suite passed across 6 edge targets (1,240 tests)",
        link: "/app/releases",
      });

      return NextResponse.json({
        success: true,
        event: "ci_passed",
        message: "Automated CI suite passed across 6 edge targets. Pre-flight verification updated to 100%."
      });
    }

    return NextResponse.json({ success: true, message: "Webhook received" });
  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
