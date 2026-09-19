import { NextRequest, NextResponse } from "next/server";
import { INITIAL_PULL_REQUESTS, PullRequest } from "@/server/prData";
import { broadcastEvent } from "@/server/events";
import { db } from "@/server/db";

// Memory storage for PR state across runtime
declare global {
  var __novaPullRequests: PullRequest[] | undefined;
}

const pullRequests: PullRequest[] = global.__novaPullRequests || [...INITIAL_PULL_REQUESTS];
if (process.env.NODE_ENV !== "production") {
  global.__novaPullRequests = pullRequests;
}

export async function GET() {
  return NextResponse.json({ success: true, pullRequests });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    const prIndex = pullRequests.findIndex((p) => p.id === id || p.number === Number(id));
    if (prIndex === -1) {
      return NextResponse.json({ error: "Pull request not found" }, { status: 404 });
    }

    const pr = pullRequests[prIndex];

    if (action === "merge") {
      pr.status = "merged";

      // If linked to an issue, mark issue as done in db
      if (pr.linkedIssueKey) {
        const matchingTask = db.getTaskById(pr.linkedIssueKey);
        if (matchingTask) {
          db.updateTask(matchingTask.id, { status: "done" });
        }
      }

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: `PR #${pr.number} Merged`,
        message: `${pr.author.name} merged PR #${pr.number} (${pr.title}) into ${pr.targetBranch}`,
        link: "/app/pull-requests",
        meta: { prId: pr.id, prNumber: pr.number },
      });

      return NextResponse.json({ success: true, pullRequest: pr });
    }

    return NextResponse.json({ success: true, pullRequest: pr });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update pull request" }, { status: 500 });
  }
}
